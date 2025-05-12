import uuid
from typing import List
from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.location import Nation

class Airline(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False,unique=True)
    nation_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(Nation.id), nullable=False)
    address: Mapped[str] = mapped_column(db.String(255), nullable=False)
    zip: Mapped[str] = mapped_column(db.String(255), nullable=False)
    email: Mapped[str] = mapped_column(db.String(255), nullable=False)
    website: Mapped[str] = mapped_column(db.String(255), nullable=False)
    is_approved: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    first_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)
    business_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)
    economy_class_description: Mapped[str] = mapped_column(db.Text, nullable=False)
    
    nation: Mapped[Nation] = relationship(Nation, foreign_keys=[nation_id])
    aircrafts: Mapped[List['AirlineAircraft']] = relationship('AirlineAircraft', back_populates='airline', cascade='all, delete-orphan')
    routes: Mapped[List['Route']] = relationship('Route', back_populates='airline', cascade='all, delete-orphan')
    extras: Mapped[List['Extra']] = relationship('Extra', back_populates='airline')

class AirlineAircraft(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aircraft_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('aircraft.id'), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(Airline.id), nullable=False)
    first_class_seats: Mapped[List[str]]  = mapped_column(ARRAY(db.String), nullable=False)
    business_class_seats: Mapped[List[str]]  = mapped_column(ARRAY(db.String), nullable=False)
    economy_class_seats: Mapped[List[str]]  = mapped_column(ARRAY(db.String), nullable=False)
    tail_number: Mapped[str] = mapped_column(db.String(255), nullable=False)

    airline: Mapped[Airline] = relationship(Airline, back_populates='aircrafts', foreign_keys=[airline_id])
    aircraft = relationship('Aircraft', back_populates='airline_aircrafts', foreign_keys=[aircraft_id])
    flights: Mapped[List['Flight']] = relationship('Flight', back_populates='aircraft', cascade='all, delete-orphan')



