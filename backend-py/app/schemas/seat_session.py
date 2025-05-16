from app.extensions import ma
from app.models.seat_session import SeatSession, Seat


class SeatSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Seat
        load_instance = True
        include_fk = True

    id = ma.UUID(dump_only=True)
    flight_id = ma.UUID(required=True)
    seat_number = ma.String(required=True)
    class_type = ma.String(required=True)

class SeatSessionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SeatSession
        load_instance = True
        include_fk = True

    id = ma.UUID(dump_only=True)
    user_id = ma.UUID(required=True)
    flight_id = ma.UUID(required=True)
    seats = ma.List(ma.Nested(SeatSchema))
    session_start_time = ma.DateTime(format='iso')
    session_end_time = ma.DateTime(format='iso')

# Create schema instances
seat_session_schema = SeatSessionSchema()
seat_sessions_schema = SeatSessionSchema(many=True) 
