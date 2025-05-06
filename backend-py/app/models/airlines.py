import uuid
from typing import List

from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.aircraft import Aircraft
from app.models.user import Nation


class Airline(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False,unique=True)
    address: Mapped[str] = mapped_column(db.String(255), nullable=False)  # sede principale
    zip: Mapped[str] = mapped_column(db.String(255), nullable=False)
    nation_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('nation.id'), nullable=False)
    nation: Mapped[Nation] = relationship('Nation', backref=db.backref('airline', lazy=True))
    extras: Mapped[List['Extra']] = relationship('Extra', backref='airline', lazy=True)
    email: Mapped[str] = mapped_column(db.String(255), nullable=False)
    website: Mapped[str] = mapped_column(db.String(255), nullable=False)
    is_approved: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    first_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)
    business_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)
    economy_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)


class AirlineAircraft(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aircraft_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('aircraft.id'), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('airline.id'), nullable=False)
    first_class_seats: Mapped[List[str]]  = mapped_column(ARRAY(db.String), nullable=False)
    business_class_seats: Mapped[List[str]]  = mapped_column(ARRAY(db.String), nullable=False)
    economy_class_seats: Mapped[List[str]]  = mapped_column(ARRAY(db.String), nullable=False)
    tail_number: Mapped[str] = mapped_column(db.String(255), nullable=False)


class Extra(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    description: Mapped[str] = mapped_column(db.String(255), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('airline.id'), nullable=False)
    all_flights: Mapped[bool] = mapped_column(db.Boolean, default=False)
    stackable: Mapped[bool] = mapped_column(db.Boolean, default=False)

