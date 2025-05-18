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
    seats: Mapped[List['AirlineAircraftSeat']] = relationship('AirlineAircraftSeat', back_populates='airline_aircraft',
                                                              cascade='all, delete-orphan')
    tail_number: Mapped[str] = mapped_column(db.String(255), nullable=False, unique=True)
    airline: Mapped[Airline] = relationship(Airline, back_populates='aircrafts', foreign_keys=[airline_id])
    aircraft = relationship('Aircraft', back_populates='airline_aircrafts', foreign_keys=[aircraft_id])
    flights: Mapped[List['Flight']] = relationship('Flight', back_populates='aircraft', cascade='all, delete-orphan')
    
    @property
    def first_class_seats(self) -> List[str]:
        seats = AirlineAircraftSeat.query.filter_by(
            airline_aircraft_id=self.id,
            class_type=ClassType.FIRST_CLASS
        ).all()
        return [seat.seat_number for seat in seats]
    
    def add_seats(self, value: List[str],class_type: ClassType):
        #TODO ADD TRIGGER to check se ci sono troppi posti
        if not isinstance(value, list):
            raise ValueError("seats must be a list")
        business_class_seats = self.business_class_seats
        economy_class_seats = self.economy_class_seats
        first_class_seats = self.first_class_seats
        for seat in value:
            seat = seat.strip().upper()
            if not re.match(r'^\d+[A-Z]$', seat):
                raise ValueError(f"Invalid seat number format: {seat}")
            if seat in business_class_seats or seat in economy_class_seats or seat in first_class_seats:
                AirlineAircraftSeat.query.filter_by(
                    airline_aircraft_id=self.id,
                    seat_number=seat
                ).delete()
                db.session.commit()
            seat_in = AirlineAircraftSeat(airline_aircraft_id=self.id, seat_number=seat, class_type=class_type)
            db.session.add(seat_in)
        db.session.commit()
    
    @first_class_seats.setter
    def first_class_seats(self, value: List[str]):
        self.add_seats(value,ClassType.FIRST_CLASS)

    @property
    def business_class_seats(self) -> List[str]:
        seats = AirlineAircraftSeat.query.filter_by(
            airline_aircraft_id=self.id,
            class_type=ClassType.BUSINESS_CLASS
        ).all()
        return [seat.seat_number for seat in seats]
    
    @business_class_seats.setter
    def business_class_seats(self, value: List[str]):
        self.add_seats(value,ClassType.BUSINESS_CLASS)
    @property
    def economy_class_seats(self) -> List[str]:
        seats = AirlineAircraftSeat.query.filter_by(
            airline_aircraft_id=self.id,
            class_type=ClassType.ECONOMY_CLASS
        ).all()
        return [seat.seat_number for seat in seats]
    
    
    @economy_class_seats.setter
    def economy_class_seats(self, value: List[str]):
        self.add_seats(value,ClassType.ECONOMY_CLASS)   

class AirlineAircraftSeat(db.Model):
    __tablename__ = 'airline_aircraft_seat'
    airline_aircraft_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(AirlineAircraft.id), primary_key=True)
    seat_number: Mapped[str] = mapped_column(db.String(255), primary_key=True)
    class_type: Mapped[ClassType] = mapped_column(db.Enum(ClassType), nullable=False)

    airline_aircraft: Mapped[AirlineAircraft] = relationship(AirlineAircraft, back_populates='seats', foreign_keys=[airline_aircraft_id])
