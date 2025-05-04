import enum
import uuid

from flask_security.models import sqla
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db
from app.models.base import Base
from sqlalchemy.dialects.postgresql import UUID

class Role(Base, sqla.FsRoleMixin):
    __tablename__ = 'role'

class User(sqla.FsUserMixin,db.Model):
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(db.String(255), nullable=False)
    password: Mapped[str] = mapped_column(db.String(255), nullable=False)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    surname: Mapped[str] = mapped_column(db.String(255), nullable=False)
    address: Mapped[str] = mapped_column(db.String(255), nullable=True)
    zip: Mapped[str] = mapped_column(db.String(255), nullable=True)
    nation: Mapped[str] = mapped_column(db.String(255), nullable=True)  # FK


    def __repr__(self):
        return f'<User {self.username}>'

class DebitCard(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(db.UUID, db.ForeignKey('user.id'), nullable=False)
    user: Mapped["User"] = relationship('User', backref=db.backref('cards', lazy=True))
    last_4_card: Mapped[str] = mapped_column(db.String(255), nullable=False)
    credit_card_expiration: Mapped[str] = mapped_column(db.String(255), nullable=False)
    circuits: Mapped[str] = mapped_column(db.String(255), nullable=False)