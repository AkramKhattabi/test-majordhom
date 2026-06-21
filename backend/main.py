# Point d'entrée de l'API FastAPI.
# Ce fichier :
#   1. crée l'application FastAPI et configure le CORS (pour autoriser
#      le frontend React, servi sur un autre port, à appeler l'API),
#   2. crée les tables de la base de données au démarrage si elles
#      n'existent pas encore,
#   3. expose la route POST /api/contact utilisée par le formulaire.
#
# Pour lancer le serveur en local :
#   cd backend
#   ../backend/.venv/bin/uvicorn main:app --reload --port 8000

import json

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import Base, engine, get_db

# Crée les tables définies dans models.py si elles n'existent pas déjà
# dans le fichier contacts.db. En production, on utiliserait plutôt un
# outil de migration (Alembic) au lieu de create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Tremplin Test")

# Le frontend Vite tourne sur un port différent (ex: 5173) de l'API (8000).
# Sans CORS, le navigateur bloquerait les requêtes du frontend vers l'API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/contact", response_model=schemas.ContactRequestOut, status_code=201)
def create_contact_request(
    payload: schemas.ContactRequestCreate, db: Session = Depends(get_db)
):
    """
    Reçoit les données du formulaire de contact (déjà validées par Pydantic
    grâce au type `ContactRequestCreate`), les enregistre en base de données,
    puis renvoie la ligne créée.
    """

    # On sérialise la liste des disponibilités en JSON car SQLite ne sait
    # stocker que du texte/nombre, pas des listes d'objets directement.
    db_contact = models.ContactRequest(
        civility=payload.civility,
        first_name=payload.firstName,
        last_name=payload.lastName,
        email=payload.email,
        phone=payload.phone,
        request_type=payload.requestType,
        message=payload.message,
        availabilities=json.dumps([a.model_dump() for a in payload.availabilities]),
    )

    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)

    # On reconstruit la réponse en désérialisant le JSON stocké, pour
    # correspondre au schéma de sortie ContactRequestOut.
    return schemas.ContactRequestOut(
        id=db_contact.id,
        civility=db_contact.civility,
        firstName=db_contact.first_name,
        lastName=db_contact.last_name,
        email=db_contact.email,
        phone=db_contact.phone,
        requestType=db_contact.request_type,
        message=db_contact.message,
        availabilities=json.loads(db_contact.availabilities),
        created_at=db_contact.created_at,
    )
