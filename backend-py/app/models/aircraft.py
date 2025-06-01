from typing import List
from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY
from app.models.airlines import AirlineAircraft

class Aircraft(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(nullable=False,unique=True)
    rows: Mapped[int] = mapped_column(nullable=False)
    columns: Mapped[int] = mapped_column(nullable=False)
    unavailable_seats: Mapped[List[str]] = mapped_column(ARRAY(db.String), nullable=False)

    airline_aircrafts: Mapped[List[AirlineAircraft]] = relationship(AirlineAircraft, back_populates='aircraft', cascade='all, delete-orphan')
