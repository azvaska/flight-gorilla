import uuid
from datetime import datetime
from typing import List

from sqlalchemy import UniqueConstraint
from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.common import ClassType
from app.models.user import User

class SeatSession(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey('user.id'), nullable=False)
    session_start_time: Mapped[datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    session_end_time: Mapped[datetime] = mapped_column(db.DateTime(timezone=True), nullable=False)
    user: Mapped[User] = relationship(User, foreign_keys=[user_id], lazy='joined')
    seats : Mapped[List['Seat']] = relationship('Seat', back_populates='session', cascade='all, delete-orphan')
    __table_args__ = (
        db.Index('ix_seat_session_cleanup', 'session_end_time'), 
        db.Index('ix_seat_session_user', 'user_id'),  )

class Seat(db.Model):
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(SeatSession.id),primary_key=True)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('flight.id'),primary_key=True)
    seat_number: Mapped[str] = mapped_column(db.String(255), nullable=False)

    session = relationship(SeatSession, back_populates='seats', foreign_keys=[session_id], lazy='joined')
    class_type: Mapped[ClassType] = mapped_column(db.Enum(ClassType), nullable=False)

    __table_args__ = (
        db.Index('ix_seat_flight_session', 'flight_id', 'session_id',"seat_number","class_type"),
        UniqueConstraint('flight_id', 'seat_number', name='uix_flight_seat'),
    )


