import re
import uuid
from symtable import Class
from typing import List
from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.common import ClassType
from app.models.location import Nation

class Airline(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False,unique=True)
    nation_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(Nation.id,ondelete='RESTRICT'), nullable=True)
    address: Mapped[str] = mapped_column(db.String(255), nullable=True)
    zip: Mapped[str] = mapped_column(db.String(255), nullable=True)
    email: Mapped[str] = mapped_column(db.String(255), nullable=True)
    website: Mapped[str] = mapped_column(db.String(255), nullable=True)
    first_class_description: Mapped[str] = mapped_column(db.Text, nullable=True)
    business_class_description: Mapped[str] = mapped_column(db.Text, nullable=True)
    economy_class_description: Mapped[str] = mapped_column(db.Text, nullable=True)
    
    nation: Mapped[Nation] = relationship(Nation, foreign_keys=[nation_id])
    aircrafts: Mapped[List['AirlineAircraft']] = relationship('AirlineAircraft', back_populates='airline', cascade='all, delete-orphan')
    routes: Mapped[List['Route']] = relationship('Route', back_populates='airline', cascade='all, delete-orphan')
    extras: Mapped[List['Extra']] = relationship('Extra', back_populates='airline', cascade='all, delete-orphan')

class AirlineAircraft(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aircraft_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('aircraft.id',ondelete='RESTRICT'), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(Airline.id,ondelete='RESTRICT'), nullable=False)
    seats: Mapped[List['AirlineAircraftSeat']] = relationship('AirlineAircraftSeat', back_populates='airline_aircraft',
                                                              cascade='all, delete-orphan')
    tail_number: Mapped[str] = mapped_column(db.String(255), nullable=False, unique=True)
    airline: Mapped[Airline] = relationship(Airline, back_populates='aircrafts', foreign_keys=[airline_id])
    aircraft = relationship('Aircraft', back_populates='airline_aircrafts', foreign_keys=[aircraft_id])
    flights: Mapped[List['Flight']] = relationship('Flight', back_populates='aircraft', cascade='all, delete-orphan') #TODO ha senso che cancelli anche i voli?
    
    def _get_seats_by_class(self, class_type: ClassType) -> List[str]:
        """Get seats by class type"""
        seats = db.session.query(AirlineAircraftSeat.seat_number).filter_by(
            airline_aircraft_id=self.id,
            class_type=class_type
        ).all()
        
        return [seat[0] for seat in seats]

    @property
    def first_class_seats(self) -> List[str]:
        return self._get_seats_by_class(ClassType.FIRST_CLASS)

    @property
    def business_class_seats(self) -> List[str]:
        return self._get_seats_by_class(ClassType.BUSINESS_CLASS)

    @property
    def economy_class_seats(self) -> List[str]:
        return self._get_seats_by_class(ClassType.ECONOMY_CLASS)

    def _get_all_existing_seats(self) -> set:
        """Get all existing seats in a single query"""
        seats = db.session.query(AirlineAircraftSeat.seat_number).filter_by(
            airline_aircraft_id=self.id
        ).all()
        return {seat[0] for seat in seats}

    def add_seats(self, value: List[str], class_type: ClassType):
        if not isinstance(value, list):
            raise ValueError("seats must be a list")
        
        if not value:  # Empty list
            return
        
        # Validate all seats first
        normalized_seats = []
        for seat in value:
            seat = seat.strip().upper()
            if not re.match(r'^\d+[A-Z]$', seat):
                raise ValueError(f"Invalid seat number format: {seat}")
            normalized_seats.append(seat)
        
        # Get all existing seats in one query
        existing_seats = self._get_all_existing_seats()
        
        # Remove existing seats that conflict (batch delete)
        seats_to_remove = [seat for seat in normalized_seats if seat in existing_seats]
        if seats_to_remove:
            db.session.query(AirlineAircraftSeat).filter(
                AirlineAircraftSeat.airline_aircraft_id == self.id,
                AirlineAircraftSeat.seat_number.in_(seats_to_remove)
            ).delete(synchronize_session=False)
        
        # Batch insert new seats
        new_seats = [
            AirlineAircraftSeat(
                airline_aircraft_id=self.id,
                seat_number=seat,
                class_type=class_type
            )
            for seat in normalized_seats
        ]
        
        db.session.add_all(new_seats)
        db.session.commit()

    @first_class_seats.setter
    def first_class_seats(self, value: List[str]):
        self.add_seats(value, ClassType.FIRST_CLASS)

    @business_class_seats.setter
    def business_class_seats(self, value: List[str]):
        self.add_seats(value, ClassType.BUSINESS_CLASS)
        
    @economy_class_seats.setter
    def economy_class_seats(self, value: List[str]):
        self.add_seats(value, ClassType.ECONOMY_CLASS)

class AirlineAircraftSeat(db.Model):
    __tablename__ = 'airline_aircraft_seat'
    airline_aircraft_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(AirlineAircraft.id,ondelete='CASCADE'), primary_key=True)
    seat_number: Mapped[str] = mapped_column(db.String(255), primary_key=True)
    class_type: Mapped[ClassType] = mapped_column(db.Enum(ClassType), nullable=False)

    airline_aircraft: Mapped[AirlineAircraft] = relationship(AirlineAircraft, back_populates='seats', foreign_keys=[airline_aircraft_id])
    __table_args__ = (
        # Index for efficient seat queries by aircraft and class
        db.Index('ix_airline_aircraft_seat_class', 'airline_aircraft_id', 'class_type'),
    )