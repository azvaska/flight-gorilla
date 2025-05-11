from app.extensions import ma
from app.models.seat_session import SeatSession

class SeatSessionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SeatSession
        load_instance = True
        include_fk = True

    id = ma.UUID(dump_only=True)
    user_id = ma.UUID(required=True)
    flight_id = ma.UUID(required=True)
    session_start_time = ma.DateTime(format='iso')
    session_end_time = ma.DateTime(format='iso')

# Create schema instances
seat_session_schema = SeatSessionSchema()
seat_sessions_schema = SeatSessionSchema(many=True) 
