from typing import List
import uuid
from sqlalchemy import UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db
from app.models.airlines import Airline

class Extra(db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    description: Mapped[str] = mapped_column(db.String(255), nullable=False)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(Airline.id), nullable=False)
    required_on_all_segments: Mapped[bool] = mapped_column(db.Boolean, default=False)
    stackable: Mapped[bool] = mapped_column(db.Boolean, default=False)
    __table_args__ = (
        UniqueConstraint('name', 'airline_id', name='uq_extra_name_airline'),
    )

    airline: Mapped[Airline] = relationship(Airline, back_populates="extras", foreign_keys=[airline_id], lazy='joined')
    flight_extras: Mapped[List['FlightExtra']] = relationship('FlightExtra', back_populates='extra', cascade='all, delete-orphan', lazy='joined')
    