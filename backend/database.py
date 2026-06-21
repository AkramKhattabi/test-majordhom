# Ce fichier configure la connexion à la base de données.
# On utilise SQLite (un simple fichier "contacts.db") pour ne pas avoir besoin
# d'installer un serveur de base de données externe (Postgres, MySQL, etc.).
# Pour passer à une autre base de données en production, il suffit de changer
# la valeur de DATABASE_URL (ex: "postgresql://user:password@host/dbname").

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# On ancre le chemin du fichier sqlite sur l'emplacement de CE fichier
# (et non sur le dossier courant du process). Sans ça, un chemin relatif
# comme "./contacts.db" crée le fichier à un endroit différent selon
# l'endroit d'où la commande "uvicorn" est lancée (racine du projet vs
# dossier backend/), ce qui donne l'impression que les données "disparaissent".
DB_PATH = Path(__file__).resolve().parent / "contacts.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# "check_same_thread" est nécessaire uniquement pour SQLite car par défaut
# SQLite interdit de partager une connexion entre plusieurs threads, alors
# que FastAPI peut traiter les requêtes dans des threads différents.
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal est une "fabrique" de sessions : chaque requête HTTP va
# créer sa propre session pour parler à la base de données.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base est la classe dont vont hériter tous nos modèles SQLAlchemy (voir models.py).
Base = declarative_base()


def get_db():
    """
    Dépendance FastAPI : ouvre une session de base de données pour la durée
    d'une requête, puis la referme automatiquement (même en cas d'erreur).
    Utilisée avec `Depends(get_db)` dans les routes de main.py.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
