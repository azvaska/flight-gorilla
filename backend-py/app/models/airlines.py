import uuid

from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.models.aircraft import Aircraft


class Airline(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    address: Mapped[str] = mapped_column(db.String(255), nullable=False)  # sede principale
    zip: Mapped[str] = mapped_column(db.String(255), nullable=False)
    nation: Mapped[str] = mapped_column(db.String(255), nullable=False)  # FK
    email: Mapped[str] = mapped_column(db.String(255), nullable=False)
    website: Mapped[str] = mapped_column(db.String(255), nullable=False)
    is_approved: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    first_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)
    business_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)
    economy_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)


class AirlineAircraft(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aircraft_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('aircraft.id'), nullable=False)
    airlines_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('airline.id'), nullable=False)
    first_class_seats: Mapped[ARRAY] = mapped_column(ARRAY(db.String), nullable=False)
    business_class_seats: Mapped[ARRAY] = mapped_column(ARRAY(db.String), nullable=False)
    economy_class_seats: Mapped[ARRAY] = mapped_column(ARRAY(db.String), nullable=False)
    tail_number: Mapped[str] = mapped_column(db.String(255), nullable=False)


class Extra(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    description: Mapped[str] = mapped_column(db.String(255), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('airline.id'), nullable=False)
    all_flights: Mapped[bool] = mapped_column(db.Boolean, default=False)
    stackable: Mapped[bool] = mapped_column(db.Boolean, default=False)

