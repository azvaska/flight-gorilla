from marshmallow import validates, ValidationError, validate
from app.extensions import ma
from app.models.booking import Booking
from app.models.flight import Flight

class BookingSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Booking
        load_instance = True
        include_fk = True

    id = ma.UUID(dump_only=True)
    user_id = ma.UUID(required=True)
    flight_id = ma.UUID(required=True)
    class_type = ma.String(required=True, validate=validate.OneOf(['FIRST', 'BUSINESS', 'ECONOMY']))
    seat_number = ma.String(required=True)
    created_at = ma.DateTime(dump_only=True)
    total_price = ma.Float(required=True)
    is_insurance_purchased = ma.Boolean()
    payment_id = ma.String()
    extras = ma.List(ma.UUID())

    @validates('flight_id')
    def validate_flight_id(self, value):
        flight = Flight.query.get(value)
        if not flight:
            raise ValidationError("Flight with given ID does not exist.")

    @validates('seat_number')
    def validate_seat_number(self, value):
        if not value or len(value) < 2:
            raise ValidationError("Seat number must be provided and valid.")

# Create schema instances
booking_schema = BookingSchema()
bookings_schema = BookingSchema(many=True) 
