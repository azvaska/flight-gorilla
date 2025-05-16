import datetime

from marshmallow import Schema, fields as ma_fields, validates, ValidationError

from app.extensions import ma
from app.models import SeatSession, Booking
from app.models.booking import BookingDepartureFlight, BookingFlightExtra
from app.models.common import ClassType
from app.models.flight import Flight, FlightExtra
from app.models.extra import Extra
from app.schemas.flight import FlightSchema


class BookingInputSchema(Schema):
    session_id = ma_fields.UUID(required=True)
    departure_flights = ma_fields.List(ma_fields.UUID, required=True)
    return_flights = ma_fields.List(ma_fields.UUID, required=True)
    extras_id = ma_fields.List(ma_fields.UUID(), required=True)
    has_booking_insurance = ma_fields.Boolean(required=True)


    @validates('departure_flights')
    def validate_departure_flights(self, departure_flights, **kwargs):
        for flight_id in departure_flights:
            flight = Flight.query.get(flight_id)
            if not flight:
                raise ValidationError(f"Flight with ID {flight_id} not found")
    @validates('return_flights')
    def validate_return_flights(self, return_flights, **kwargs):
        for flight_id in return_flights:
            flight = Flight.query.get(flight_id)
            if not flight:
                raise ValidationError(f"Flight with ID {flight_id} not found")

    @validates('session_id')
    def validate_session_exists(self, session_id, **kwargs):

        session = SeatSession.query.filter(SeatSession.id == session_id,
                                                SeatSession.session_end_time > datetime.datetime.now(datetime.UTC)
                                                ).first()
        if not session:
            raise ValidationError(f"Session with ID {session_id} not found")

    @validates('extras_id')
    def validate_extras_exist(self, extras_id, **kwargs):
        if extras_id:
            for extra_id in extras_id:
                extra = FlightExtra.query.get(extra_id)
                if not extra:
                    raise ValidationError(f"Extra with ID {extra_id} not found")




class BookingFlightExtraSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = BookingFlightExtra
        load_instance = True

    name = ma.String(attribute="extra_original.name")
    description = ma.String(attribute="extra_original.description")
    extra_price = ma.Float(attribute="extra_price")
    extra_id = ma.UUID(attribute="extra_id")

class BookedFlightSchema(ma.Schema):

    id = ma.UUID(dump_only=True)
    flight = ma.Nested(FlightSchema())  # Avoid circular imports
    seat_number = ma.String()
    class_type = ma.Enum(attribute="class_type",enum=ClassType)
    price = ma.Float()
    extras = ma.List(ma.Nested(BookingFlightExtraSchema()))

class BookingOutputSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Booking
        include_fk = True
        load_instance = True


    id = ma.UUID(dump_only=True)
    departure_flights = ma.List(ma.Nested(BookedFlightSchema()))
    return_flights = ma.List(ma.Nested(BookedFlightSchema()))
    total_price = ma.Method("get_total_price")
    is_insurance_purchased = ma.Boolean(attribute="has_booking_insurance")

    def get_total_price(self, obj):
        return obj.total_price


# Create schema instances
booking_schema = BookingInputSchema()
bookings_schema = BookingInputSchema(many=True)
booking_output_schema = BookingOutputSchema()
bookings_output_schema = BookingOutputSchema(many=True)