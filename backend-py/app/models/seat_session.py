import uuid
from datetime import datetime
from sqlalchemy import UniqueConstraint
from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.user import User
from app.models.flight import Flight

class SeatSession(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey('user.id'), nullable=False)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('flight.id'), nullable=False)
    seat_number: Mapped[str] = mapped_column(db.String(255), nullable=False)
    session_start_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    session_end_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)

    user: Mapped[User] = relationship(User, foreign_keys=[user_id], lazy='joined')
    flight: Mapped[Flight] = relationship(Flight, foreign_keys=[flight_id], lazy='joined')


    __table_args__ = (
        UniqueConstraint('flight_id', 'seat_number', name='uix_flight_seat'),
    )

