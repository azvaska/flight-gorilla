import uuid
from datetime import datetime

from sqlalchemy import UniqueConstraint

from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column



class SeatSession(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey('user.id'), nullable=False)
    flight_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey('flight.id'), nullable=False)
    seat_number: Mapped[str] = mapped_column(db.String(255), nullable=False)
    session_start_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    session_end_time: Mapped[datetime] = mapped_column(db.DateTime, nullable=False)
    __table_args__ = (
        UniqueConstraint('flight_id', 'seat_number', name='uix_flight_seat'),
    )

