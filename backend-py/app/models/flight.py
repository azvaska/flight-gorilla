import uuid
import datetime
from typing import List

from sqlalchemy import Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.extensions import db
from app.models import AirlineAircraft
from app.models.seat_session import SeatSession, Seat
from app.models.airlines import Airline
from app.models.airport import Airport
from app.models.extra import Extra


class Route(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    flight_number: Mapped[str] = mapped_column(db.String(255), nullable=False,unique=True)
    departure_airport_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(Airport.id), nullable=False)
    arrival_airport_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(Airport.id), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(Airline.id), nullable=False)
    period_start: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)

    departure_airport: Mapped[Airport] = relationship(Airport, foreign_keys=[departure_airport_id], lazy='joined')
    arrival_airport: Mapped[Airport] = relationship(Airport, foreign_keys=[arrival_airport_id], lazy='joined')
    airline: Mapped[Airline] = relationship(Airline, back_populates='routes', foreign_keys=[airline_id], lazy='joined')
    flights: Mapped[List['Flight']] = relationship('Flight', back_populates='route', cascade='all, delete-orphan')
    __table_args__ = (
        # For route-based searches
        db.Index('ix_route_airline', 'airline_id'),
        db.Index('ix_route_departure_airport', 'departure_airport_id'),
        db.Index('ix_route_arrival_airport', 'arrival_airport_id'),

        # For period filtering
        db.Index('ix_route_period', 'period_start', 'period_end'),
        
        
        # Existing constraints...
        db.CheckConstraint('period_start <= period_end', name='ck_route_period'),
        #check that departure and arrival airports are not the same
        db.CheckConstraint('departure_airport_id != arrival_airport_id', name='ck_route_different_airports'),
        #check that period_start is in the future
        db.CheckConstraint('period_start > now()', name='ck_route_period_start_future'),
        #check flight_number is not empty
        db.CheckConstraint('flight_number != \'\'', name='ck_route_flight_number_not_empty'),
    )



class Flight(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id: Mapped[int] = mapped_column(db.Integer,db.ForeignKey(Route.id), nullable=False)
    aircraft_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(AirlineAircraft.id), nullable=False)

    departure_time: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    arrival_time: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    checkin_start_time: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    checkin_end_time: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    boarding_start_time: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    boarding_end_time: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)

    gate: Mapped[str] = mapped_column(db.String(255), nullable=True)
    terminal: Mapped[str] = mapped_column(db.String(255), nullable=True)

    price_first_class: Mapped[float] = mapped_column(db.Float, nullable=False)
    price_business_class: Mapped[float] = mapped_column(db.Float, nullable=False)
    price_economy_class: Mapped[float] = mapped_column(db.Float, nullable=False)
    price_insurance: Mapped[float] = mapped_column(db.Float, nullable=False)

    fully_booked: Mapped[bool] = mapped_column(db.Boolean, default=False)

    route: Mapped[Route] = relationship(Route, back_populates='flights', foreign_keys=[route_id])
    aircraft: Mapped[AirlineAircraft] = relationship(AirlineAircraft, back_populates='flights', foreign_keys=[aircraft_id])
    available_extras: Mapped[List['FlightExtra']] = relationship('FlightExtra', back_populates='flight', cascade='all, delete-orphan',lazy='noload' )

    departure_bookings = relationship("BookingDepartureFlight", back_populates="flight",lazy='joined')
    return_bookings = relationship("BookingReturnFlight", back_populates="flight",lazy='joined')

    __table_args__ = (
        # For flight search queries - most important
        db.Index('ix_flight_departure_time', 'departure_time'),
        db.Index('ix_flight_route_departure', 'route_id', 'departure_time'),
        db.Index('ix_flight_search_composite', 'route_id', 'departure_time', 'fully_booked'),
        db.Index('ix_flight_fully_booked', 'fully_booked'),
        # For price filtering
        db.Index('ix_flight_prices', 'price_economy_class', 'price_business_class', 'price_first_class'),
        # Existing constraints...
    )


    @property
    def departure_airport(self):
        return self.route.departure_airport

    @property
    def arrival_airport(self):
        return self.route.arrival_airport

    @property
    def airline(self):
        return self.route.airline
    
    @property
    def flight_number(self):
        return self.route.flight_number
    
    @property
    def bookings(self):
        return [*self.departure_bookings, *self.return_bookings]
    

    @property
    def booked_seats(self):
        booked_seats = []
        for booking in self.departure_bookings:
            booked_seats.append(booking.seat_number)
        for booking in self.return_bookings:
            booked_seats.append(booking.seat_number)

        session_seats_obj = (Seat.query.join(SeatSession)
                             .filter(SeatSession.session_end_time > datetime.datetime.now(datetime.UTC),
                                     Seat.flight_id == self.id).all())
        session_seats = [seat.seat_number for seat in session_seats_obj]
        return booked_seats + session_seats
    @property
    def booked_seats_confirmed(self):
        """Get all booked seats that are confirmed (not in session)"""
        booked_seats = []
        for booking in self.departure_bookings:
            booked_seats.append(booking.seat_number)
        for booking in self.return_bookings:
            booked_seats.append(booking.seat_number)

        return booked_seats

    @property
    def seats_info(self):
        return {
            "first_class_seats": self.aircraft.first_class_seats,
            "business_class_seats": self.aircraft.business_class_seats,
            "economy_class_seats": self.aircraft.economy_class_seats,
            "booked_seats": self.booked_seats,
        }
    
    @property
    def rows(self):
        return self.aircraft.aircraft.rows

    
    
class FlightExtra(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(Flight.id))
    extra_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(Extra.id))
    price: Mapped[float] = mapped_column(db.Float, nullable=False)
    limit: Mapped[int] = mapped_column(db.Integer, nullable=False)

    flight: Mapped[Flight] = relationship(Flight, back_populates='available_extras')
    extra: Mapped[Extra] = relationship(Extra, back_populates='flight_extras', foreign_keys=[extra_id], lazy='joined')
    
    #i want flight and extra_id to be unique together
    __table_args__ = (
        db.Index('ix_flight_extra_flight', 'flight_id'),
        db.Index('ix_flight_extra_extra', 'extra_id'),
        db.UniqueConstraint('flight_id', 'extra_id', name='uq_flight_extra'),)