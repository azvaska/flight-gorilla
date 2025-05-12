from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db

class Nation(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    code: Mapped[str] = mapped_column(db.String(255), nullable=False)
    alpha2: Mapped[str] = mapped_column(db.String(2), nullable=False)

    cities: Mapped[List['City']] = relationship('City', back_populates='nation')


class City(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    nation_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(Nation.id), nullable=True)

    nation: Mapped[Nation] = relationship('Nation', back_populates='cities', foreign_keys=[nation_id], lazy='joined')
    airports: Mapped[List['Airport']] = relationship('Airport', back_populates='city', cascade='all, delete-orphan')
