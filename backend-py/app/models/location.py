from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.extensions import db

class Nation(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    code: Mapped[str] = mapped_column(db.String(255), nullable=False)
    alpha2: Mapped[str] = mapped_column(db.String(2), nullable=False)

    cities: Mapped[List['City']] = relationship('City', back_populates='nation')
    __table_args__ = (
        db.Index('ix_nation_alpha2', 'alpha2'),
        db.Index('ix_nation_name', 'name'),
    )

class City(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    nation_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(Nation.id), nullable=True)

    nation: Mapped[Nation] = relationship('Nation', back_populates='cities', foreign_keys=[nation_id], lazy='joined')
    airports: Mapped[List['Airport']] = relationship('Airport', back_populates='city', cascade='all, delete-orphan')
    __table_args__ = (
        db.Index('ix_city_nation', 'nation_id'),
        db.Index('idx_city_name_trgm', 'name', postgresql_using='gin', postgresql_ops={'name': 'gin_trgm_ops'}),

    )
