import enum
import uuid
from datetime import datetime

from sqlalchemy import Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID


class ClassType(enum.Enum):
    FIRST_CLASS = "First Class"
    BUSINESS_CLASS = "Business Class"
    ECONOMY_CLASS = "Economy Class"



booking_flight_departure = Table(
    'booking_flight_departure', db.metadata,
    db.Column('book_id', db.UUID, db.ForeignKey('booking.id'), primary_key=True),
    db.Column('seat_number', db.String, nullable=False),
    db.Column('class_type', db.Enum(ClassType), nullable=False),
    db.Column('flight_id', db.UUID, db.ForeignKey('flight.id'), primary_key=True)
)

booking_flight_arrival = Table(
    'booking_flight_arrival', db.metadata,
    db.Column('book_id', db.UUID, db.ForeignKey('booking.id'), primary_key=True),
    db.Column('seat_number', db.String, nullable=False),
    db.Column('class_type', db.Enum(ClassType), nullable=False),
    db.Column('flight_id', db.UUID, db.ForeignKey('flight.id'), primary_key=True)
)


class Booking(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey('user.id'), nullable=False)

    departure_checkin: Mapped[datetime] = mapped_column(db.DateTime, nullable=True)
    arrival_checkin: Mapped[datetime] = mapped_column(db.DateTime, nullable=True)
    has_booking_insurance: Mapped[bool] = mapped_column(db.Boolean, default=False)  # check -> first class automatically

    departure_flight = relationship(
        'Flight',
        secondary=booking_flight_departure,
        back_populates='departure_booking'
    )
    arrival_flight = relationship(
        'Flight',
        secondary=booking_flight_arrival,
        back_populates='arrival_bookings'
    )