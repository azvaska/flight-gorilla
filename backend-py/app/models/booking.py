import enum
from typing import List
import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID
from app.models.flight import Flight, FlightExtra
from app.models.user import User


class ClassType(enum.Enum):
    FIRST_CLASS = "First Class"
    BUSINESS_CLASS = "Business Class"
    ECONOMY_CLASS = "Economy Class"

class Booking(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey(User.id), nullable=False)
    departure_checkin: Mapped[datetime] = mapped_column(db.DateTime, nullable=True)
    return_checkin: Mapped[datetime] = mapped_column(db.DateTime, nullable=True)
    has_booking_insurance: Mapped[bool] = mapped_column(db.Boolean, default=False)

    user: Mapped[User] = relationship(User, back_populates='bookings', foreign_keys=[user_id], lazy='joined')
    departure_flights: Mapped[List['BookingDepartureFlight']] = relationship('BookingDepartureFlight', back_populates='booking', cascade='all, delete-orphan')
    return_flights: Mapped[List['BookingReturnFlight']] = relationship('BookingReturnFlight', back_populates='booking', cascade='all, delete-orphan')

class BookingDepartureFlight(db.Model):
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Booking.id), nullable=False, primary_key=True)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Flight.id), nullable=False, primary_key=True)
    seat_number: Mapped[str] = mapped_column(db.String, nullable=False)
    class_type: Mapped[ClassType] = mapped_column(db.Enum(ClassType), nullable=False)

    booking: Mapped[Booking] = relationship(Booking, back_populates='departure_flights', foreign_keys=[booking_id], lazy='joined')
    flight: Mapped[Flight] = relationship(Flight, back_populates='departure_bookings', foreign_keys=[flight_id], lazy='joined')

class BookingReturnFlight(db.Model):
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Booking.id), nullable=False, primary_key=True)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Flight.id), nullable=False, primary_key=True)
    seat_number: Mapped[str] = mapped_column(db.String, nullable=False)
    class_type: Mapped[ClassType] = mapped_column(db.Enum(ClassType), nullable=False)
    
    booking: Mapped[Booking] = relationship(Booking, back_populates='return_flights', foreign_keys=[booking_id], lazy='joined')
    flight: Mapped[Flight] = relationship(Flight, back_populates='return_bookings', foreign_keys=[flight_id], lazy='joined')

class BookingFlightExtra(db.Model):
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Booking.id), nullable=False, primary_key=True)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Flight.id), nullable=False, primary_key=True)
    extra_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey("flight_extra.id"), nullable=False, primary_key=True)

    booking: Mapped[Booking] = relationship(Booking, foreign_keys=[booking_id])
    flight: Mapped[Flight] = relationship(Flight, foreign_keys=[flight_id])
    extra: Mapped[FlightExtra] = relationship(FlightExtra, foreign_keys=[extra_id])

