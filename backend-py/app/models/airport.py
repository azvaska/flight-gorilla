from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.location import City

class Airport(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    iata_code: Mapped[str] = mapped_column(db.String(3), nullable=True,unique=True)
    icao_code :  Mapped[str] = mapped_column(db.String(4), nullable=True)
    latitude: Mapped[float] = mapped_column(db.Float, nullable=False)
    longitude: Mapped[float] = mapped_column(db.Float, nullable=False)
    city_id: Mapped[int] = mapped_column(db.Integer, db.ForeignKey(City.id), nullable=False)

    city: Mapped[City] = relationship(City, back_populates="airports", foreign_keys=[city_id])
    
    __table_args__ = (
        # For location searches and filtering
        db.Index('ix_airport_city', 'city_id'),
        db.Index('idx_airport_name_trgm', 'name', postgresql_using='gin', postgresql_ops={'name': 'gin_trgm_ops'}),
        db.Index('ix_airport_codes', 'iata_code', 'icao_code'),
    )