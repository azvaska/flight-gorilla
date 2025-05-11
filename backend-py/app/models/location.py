import uuid
from datetime import datetime

from sqlalchemy import Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db



class Nation(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    code: Mapped[str] = mapped_column(db.String(255), nullable=False)
    alpha2: Mapped[str] = mapped_column(db.String(2), nullable=False)
    def __repr__(self):
        return f'<Nation {self.name}>'


class City(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    nation_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey('nation.id'), nullable=True)
    nation: Mapped[Nation] = relationship('Nation', backref=db.backref('city', lazy=True), lazy='select')
    def __repr__(self):
        return f'<City "{self.name}">'
