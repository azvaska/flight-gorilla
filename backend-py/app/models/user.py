import enum
from typing import List
import uuid
from flask_security.models import sqla
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db
from app.models.airlines import Airline
from sqlalchemy.dialects.postgresql import UUID
from app.models.location import Nation

class CardType(enum.Enum):
    DEBIT = "Debit"
    CREDIT = "Credit"
    PREPAID = "Prepaid"


class Role(db.Model, sqla.FsRoleMixin):
    __tablename__ = 'role'

class User(sqla.FsUserMixin,db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(db.String(255), nullable=False,unique=True)
    password: Mapped[str] = mapped_column(db.String(255), nullable=False)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    surname: Mapped[str] = mapped_column(db.String(255), nullable=False)
    address: Mapped[str] = mapped_column(db.String(255), nullable=True)
    zip: Mapped[str] = mapped_column(db.String(255), nullable=True)
    nation_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(Nation.id), nullable=True)
    airline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), db.ForeignKey(Airline.id), nullable=True)

    nation: Mapped[Nation] = relationship(Nation, foreign_keys=[nation_id], lazy='joined')
    airline: Mapped[Airline] = relationship(Airline, foreign_keys=[airline_id], lazy='joined')
    bookings: Mapped[List['Booking']] = relationship('Booking', back_populates='user', cascade='all, delete-orphan')
    cards: Mapped[List['PayementCard']] = relationship('PayementCard', back_populates='user', cascade='all, delete-orphan')


class PayementCard(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    holder_name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey(User.id), nullable=False)
    last_4_digits: Mapped[str] = mapped_column(db.String(255), nullable=False)
    expiration_date: Mapped[str] = mapped_column(db.String(255), nullable=False)
    circuit: Mapped[str] = mapped_column(db.String(255), nullable=False)
    card_type: Mapped[CardType] = mapped_column(db.Enum(CardType), nullable=False)

    user: Mapped[User] = relationship(User, back_populates='cards', foreign_keys=[user_id], lazy='joined')
