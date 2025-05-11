import uuid
from datetime import datetime
from typing import List

from sqlalchemy import Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.extensions import db
from app.models import AirlineAircraft

flight_extras = Table('flight_extras', db.metadata,
    db.Column('flight_id', UUID(as_uuid=True), db.ForeignKey('flight.id'), primary_key=True),
    db.Column('extra_id', db.UUID, db.ForeignKey('extra.id'), primary_key=True),
    db.Column('price', db.Float, nullable=False)
)


class Route(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    flight_number: Mapped[str] = mapped_column(db.String(255), nullable=False)

    departure_airport_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('airport.id'), nullable=False)
    arrival_airport_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('airport.id'), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('airline.id'), nullable=False)

    period_start: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)

class Flight(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id: Mapped[int] = mapped_column(db.Integer,db.ForeignKey('route.id'), nullable=False)
    aircraft_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey('airline_aircraft.id'), nullable=False)

    departure_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    arrival_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    checkin_start_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    checkin_end_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    boarding_start_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    boarding_end_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)

    gate: Mapped[str] = mapped_column(db.String(255), nullable=True)
    terminal: Mapped[str] = mapped_column(db.String(255), nullable=True)

    price_first_class: Mapped[float] = mapped_column(db.Float, nullable=False)  # check...
    price_business_class: Mapped[float] = mapped_column(db.Float, nullable=False)
    price_economy_class: Mapped[float] = mapped_column(db.Float, nullable=False)
    price_insurance: Mapped[float] = mapped_column(db.Float, nullable=False)

    extras = relationship('Extra', secondary=flight_extras, backref=db.backref('flights', lazy=True))

    departure_booking = relationship(
        'Booking',  # Use string reference to avoid circular import
        secondary='booking_flight_departure',  # Use string reference
        back_populates='departure_flight'
        # Consider adding lazy='dynamic' if you expect many bookings per flight
    )

    arrival_bookings = relationship(
        'Booking',  # Use string reference
        secondary='booking_flight_arrival',  # Use string reference
        back_populates='arrival_flight'
        # Consider adding lazy='dynamic'
    )

    def booked_seats(self):
        booked_seats = []
        for booking in self.departure_booking:
            booked_seats.append(booking.seat_number)
        for booking in self.arrival_bookings:
            booked_seats.append(booking.seat_number)
        return booked_seats

    def __str__(self):
        return f'Flight {self.route.id} {self.route.flight_number}'
    def __repr__(self):
        return f'<"{self.flight_number}"'