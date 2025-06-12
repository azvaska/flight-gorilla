import enum
from typing import List
import uuid
import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID

from app.models import Extra
from app.models.common import ClassType
from app.models.flight import Flight, FlightExtra
from app.models.user import User



class Booking(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_number: Mapped[str] = mapped_column(db.String(10), nullable=False, unique=True)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey(User.id,ondelete='CASCADE'), nullable=False)
    payment_confirmed: Mapped[bool] = mapped_column(db.Boolean, default=False)
    departure_checkin: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=True)
    return_checkin: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=True)
    has_booking_insurance: Mapped[bool] = mapped_column(db.Boolean, default=False)
    user: Mapped[User] = relationship(User, back_populates='bookings', foreign_keys=[user_id], lazy='joined')
    departure_flights: Mapped[List['BookingDepartureFlight']] = relationship('BookingDepartureFlight', back_populates='booking', cascade='all, delete-orphan')
    return_flights: Mapped[List['BookingReturnFlight']] = relationship('BookingReturnFlight', back_populates='booking', cascade='all, delete-orphan')
    created_at: Mapped[datetime.datetime] = mapped_column(db.DateTime(timezone=True), nullable=False, default=datetime.datetime.now(datetime.UTC))
    booking_flight_extras: Mapped[List['BookingFlightExtra']] = relationship(
        'BookingFlightExtra',
        back_populates='booking',
        cascade='all, delete-orphan',
        lazy='joined',
        primaryjoin="Booking.id==BookingFlightExtra.booking_id"
    )
    
    __table_args__ = (
        # For user booking queries
        db.Index('ix_booking_user', 'user_id'),
        db.Index('ix_booking_number', 'booking_number')
        
    )


    @property
    def insurance_price(self) -> float:
        return round(sum(flight.flight.price_insurance for flight in self.departure_flights) + sum(flight.flight.price_insurance for flight in self.return_flights), 2)

    @property
    def total_price(self) -> float:
        total = 0
        for flight in self.departure_flights:
            total += flight.price
            for extra in flight.extras:
                total += extra.extra_price
        for flight in self.return_flights:
            total += flight.price
            for extra in flight.extras:
                total += extra.extra_price
        total += self.insurance_price
        return round(total,2)

class BookingFlightExtra(db.Model):
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Booking.id,ondelete='CASCADE'), nullable=False, primary_key=True)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Flight.id,ondelete='RESTRICT'), nullable=False, primary_key=True)
    extra_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey("flight_extra.id",ondelete='RESTRICT'), nullable=False, primary_key=True)
    quantity: Mapped[int] = mapped_column(db.Integer, nullable=False)
    extra_price: Mapped[float] = mapped_column(db.Float, nullable=False)

    booking: Mapped[Booking] = relationship(Booking, foreign_keys=[booking_id])
    flight: Mapped[Flight] = relationship(Flight, foreign_keys=[flight_id])
    extra: Mapped[FlightExtra] = relationship(FlightExtra, foreign_keys=[extra_id])
    extra_original: Mapped[Extra] = relationship(Extra, secondary="flight_extra",
                                                 primaryjoin="BookingFlightExtra.extra_id==FlightExtra.id",
                                                 secondaryjoin="FlightExtra.extra_id==Extra.id", viewonly=True)
    
    __table_args__ = (
        db.Index('ix_booking_extra_booking', 'booking_id'),
        db.Index('ix_booking_extra_flight', 'flight_id'),
        db.Index('ix_booking_extra_extra', 'extra_id'),  # ADD THIS

    )
    
    
    
class BookingDepartureFlight(db.Model):
    # id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Booking.id,ondelete='CASCADE'), nullable=False, primary_key=True)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Flight.id,ondelete='RESTRICT'), nullable=False, primary_key=True)
    seat_number: Mapped[str] = mapped_column(db.String, nullable=False)
    class_type: Mapped[ClassType] = mapped_column(db.Enum(ClassType), nullable=False)
    price: Mapped[float] = mapped_column(db.Float, nullable=False)
    #extra_list
    extras: Mapped[List["BookingFlightExtra"]] = relationship(
        "BookingFlightExtra",
        primaryjoin="and_(BookingFlightExtra.booking_id==foreign(BookingDepartureFlight.booking_id), "
                   "BookingFlightExtra.flight_id==foreign(BookingDepartureFlight.flight_id))",
        viewonly=True,
        uselist=True,
        lazy='joined',
        cascade='all, delete-orphan',

    )
    
    booking: Mapped[Booking] = relationship(Booking, back_populates='departure_flights', foreign_keys=[booking_id], lazy='joined')
    flight: Mapped[Flight] = relationship(Flight, back_populates='departure_bookings', foreign_keys=[flight_id], lazy='joined')
    __table_args__ = (
        db.Index('ix_booking_departure_flight', 'flight_id'),
        db.Index('ix_booking_departure_booking', 'booking_id'),
        db.UniqueConstraint('flight_id', 'seat_number', name='uq_booking_departure_flight')
    )
    #create index for booking departure flight


class BookingReturnFlight(db.Model):
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Booking.id,ondelete='CASCADE'), nullable=False, primary_key=True)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID, db.ForeignKey(Flight.id,ondelete='RESTRICT'), nullable=False, primary_key=True)
    seat_number: Mapped[str] = mapped_column(db.String, nullable=False)
    class_type: Mapped[ClassType] = mapped_column(db.Enum(ClassType), nullable=False)
    price: Mapped[float] = mapped_column(db.Float, nullable=False)

    extras: Mapped[List["BookingFlightExtra"]] = relationship(
        "BookingFlightExtra",
        primaryjoin="and_(BookingFlightExtra.booking_id==foreign(BookingReturnFlight.booking_id), "
                   "BookingFlightExtra.flight_id==foreign(BookingReturnFlight.flight_id))",
        viewonly=True,
        uselist=True,
        lazy='joined',
        cascade='all, delete-orphan',
    )

    booking: Mapped[Booking] = relationship(Booking, back_populates='return_flights', foreign_keys=[booking_id], lazy='joined')
    flight: Mapped[Flight] = relationship(Flight, back_populates='return_bookings', foreign_keys=[flight_id], lazy='joined')
    __table_args__ = (
        db.Index('ix_booking_return_flight', 'flight_id'),
        db.Index('ix_booking_return_booking', 'booking_id'),
        db.UniqueConstraint('flight_id', 'seat_number', name='uq_booking_return_flight')
    )


