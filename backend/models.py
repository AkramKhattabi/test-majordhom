# Ce fichier décrit la structure des tables de la base de données
# sous forme de classes Python (mapping objet-relationnel via SQLAlchemy).
# Chaque classe = une table. Chaque attribut = une colonne.

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from database import Base


class ContactRequest(Base):
    """
    Table "contact_requests" : stocke chaque demande envoyée depuis le
    formulaire de contact du site (coordonnées + message + disponibilités).
    """

    __tablename__ = "contact_requests"

    # Identifiant unique auto-incrémenté de chaque ligne.
    id = Column(Integer, primary_key=True, index=True)

    civility = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    request_type = Column(String, nullable=False)
    message = Column(String, nullable=False)

    # Les disponibilités (liste de jour/heure de début/heure de fin) sont
    # envoyées par le frontend sous forme de liste d'objets. SQLite n'a pas
    # de type "liste" natif, donc on les stocke sérialisées en JSON (texte).
    availabilities = Column(String, nullable=False, default="[]")

    # Date de création remplie automatiquement par la base de données.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
