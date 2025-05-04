import uuid

from app.extensions import db
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

class City(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    nation: Mapped[str] = mapped_column(db.String(255), nullable=False)  # FK

    def __repr__(self):
        return f'<City "{self.name}">'

class Airport(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    code: Mapped[str] = mapped_column(db.String(255), nullable=False, unique=True)
    latitude: Mapped[float] = mapped_column(db.Float, nullable=False)
    longitude: Mapped[float] = mapped_column(db.Float, nullable=False)  # centro dell'aeroporto
    city_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('city.id'), nullable=False)
    #timezone to