# Tests de l'API FastAPI (route POST /api/contact).
#
# Pourquoi une base de données séparée pour les tests ?
# -------------------------------------------------------
# `database.py` crée un moteur SQLAlchemy connecté au fichier réel
# `contacts.db`. Si les tests utilisaient ce même fichier, ils :
#   - pollueraient les vraies données (lignes de test mélangées aux vraies),
#   - donneraient des résultats différents selon ce qui est déjà en base,
#   - ne pourraient pas être lancés en parallèle ou répétés de façon fiable.
# On utilise donc une base SQLite "in-memory" (`:memory:`), recréée à
# zéro pour chaque test, et on dit à FastAPI de l'utiliser à la place de
# la vraie via `app.dependency_overrides` (mécanisme prévu par FastAPI
# pour remplacer une dépendance — ici `get_db` — uniquement pendant les tests).

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app

# `StaticPool` force SQLAlchemy à garder une seule connexion ouverte :
# par défaut, une base ":memory:" disparaît dès qu'une connexion se ferme,
# ce qui effacerait les tables entre deux requêtes du même test.
from sqlalchemy.pool import StaticPool

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    """Recrée les tables avant chaque test : chaque test démarre avec une
    base vide, sans dépendre de l'ordre d'exécution des autres tests."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


client = TestClient(app)

# Payload minimal valide, réutilisé et légèrement modifié par chaque test
# pour ne pas répéter tous les champs à chaque fois.
VALID_PAYLOAD = {
    "civility": "M",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "0612345678",
    "requestType": "Visite",
    "message": "Bonjour, je souhaite visiter ce bien rapidement.",
    "availabilities": [{"day": "Lundi", "start": "09:00", "end": "10:00"}],
}


def test_create_contact_request_success():
    """Un payload valide doit être accepté (201) et renvoyer les données
    enregistrées, y compris un id généré et la date de création."""
    response = client.post("/api/contact", json=VALID_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["email"] == VALID_PAYLOAD["email"]
    assert body["availabilities"] == VALID_PAYLOAD["availabilities"]
    assert "created_at" in body


def test_create_contact_request_is_persisted():
    """Vérifie que la ligne est bien écrite en base, et pas seulement
    renvoyée dans la réponse HTTP (les deux sont des chemins de code
    différents : `db.add`/`db.commit` vs la sérialisation de la réponse)."""
    client.post("/api/contact", json=VALID_PAYLOAD)

    db = TestSessionLocal()
    try:
        from models import ContactRequest

        rows = db.query(ContactRequest).all()
        assert len(rows) == 1
        assert rows[0].email == VALID_PAYLOAD["email"]
    finally:
        db.close()


def test_rejects_message_too_short():
    """Le schéma Pydantic impose message >= 10 caractères (même règle que
    le Zod côté frontend) : un message trop court doit être refusé (422),
    pas planter le serveur (500)."""
    payload = {**VALID_PAYLOAD, "message": "court"}

    response = client.post("/api/contact", json=payload)

    assert response.status_code == 422


def test_rejects_invalid_email():
    """EmailStr doit refuser une adresse mal formée."""
    payload = {**VALID_PAYLOAD, "email": "pas-un-email"}

    response = client.post("/api/contact", json=payload)

    assert response.status_code == 422


def test_accepts_empty_availabilities():
    """Les disponibilités sont optionnelles : une liste vide est une
    valeur valide (cf. `availabilities: list[Availability] = []` dans
    schemas.py), pas une erreur."""
    payload = {**VALID_PAYLOAD, "availabilities": []}

    response = client.post("/api/contact", json=payload)

    assert response.status_code == 201
    assert response.json()["availabilities"] == []
