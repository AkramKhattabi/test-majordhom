# Ce fichier définit les schémas Pydantic : ils décrivent la forme des
# données attendues en entrée (validation des requêtes) et renvoyées en
# sortie (sérialisation des réponses) de l'API.
# C'est l'équivalent côté Python du schéma Zod utilisé côté frontend
# (src/lib/contactSchema.ts) : on revalide les mêmes règles côté serveur,
# car on ne doit jamais faire confiance uniquement à la validation côté client.

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class Availability(BaseModel):
    """Un créneau de disponibilité (jour + heure de début/fin)."""

    day: str
    start: str
    end: str


class ContactRequestCreate(BaseModel):
    """
    Schéma des données reçues lors de la création d'une demande de contact.
    Les contraintes (min/max de caractères, format email) reproduisent
    celles du schéma Zod du frontend.
    """

    civility: str = Field(min_length=1)
    firstName: str = Field(min_length=2)
    lastName: str = Field(min_length=2)
    email: EmailStr
    phone: str = Field(min_length=8)
    requestType: str = Field(min_length=1)
    message: str = Field(min_length=10)
    availabilities: list[Availability] = []


class ContactRequestOut(BaseModel):
    """Schéma de la réponse renvoyée après création (relit la ligne en base)."""

    id: int
    civility: str
    firstName: str
    lastName: str
    email: EmailStr
    phone: str
    requestType: str
    message: str
    availabilities: list[Availability]
    created_at: datetime

    # Permet de construire ce schéma directement à partir d'un objet
    # SQLAlchemy (models.ContactRequest) plutôt que d'un simple dict.
    model_config = {"from_attributes": True}
