import uuid

from app.extensions import db
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.location import City,Nation



class Airport(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    iata_code: Mapped[str] = mapped_column(db.String(3), nullable=True,unique=True)
    icao_code :  Mapped[str] = mapped_column(db.String(4), nullable=True)

    latitude: Mapped[float] = mapped_column(db.Float, nullable=False)
    longitude: Mapped[float] = mapped_column(db.Float, nullable=False)
    
    city_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('city.id'), nullable=False)
    city: Mapped[City] = relationship("City", backref="airports")
