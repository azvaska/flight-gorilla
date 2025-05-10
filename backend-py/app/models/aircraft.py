import uuid
from typing import List

from app.extensions import db

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY

class Aircraft(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(nullable=False)
    rows: Mapped[int] = mapped_column(nullable=False)
    columns: Mapped[int] = mapped_column(nullable=False)
    unavailable_seats: Mapped[List[str]] = mapped_column(ARRAY(db.String), nullable=False)




    # airline = db.relationship('Airline', backref=db.backref('aircrafts', lazy=True))
