from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse
from marshmallow import ValidationError
import datetime
from app.extensions import db
from app.models.booking import Booking
from app.models.flight import Flight
from app.models.seat_session import SeatSession
from app.schemas.booking import BookingSchema, booking_schema, bookings_schema

api = Namespace('booking', description='Booking related operations')

# --- RESTx Models ---
booking_model = api.model('Booking', {
    'id': fields.String(readonly=True, description='Booking ID'),
    'user_id': fields.String(readonly=True, description='User ID'),
    'flight_id': fields.String(required=True, description='Flight ID'),
    'class_type': fields.String(required=True, enum=['FIRST', 'BUSINESS', 'ECONOMY'], description='Class type'),
    'seat_number': fields.String(required=True, description='Seat number'),
    'created_at': fields.DateTime(readonly=True, description='Creation timestamp'),
    'total_price': fields.Float(required=True, description='Total price'),
    'is_insurance_purchased': fields.Boolean(description='Whether insurance was purchased'),
    'payment_id': fields.String(description='Payment reference ID'),
    'extras': fields.List(fields.String, description='List of extra service IDs')
})

# --- Request Parsers ---
booking_list_parser = reqparse.RequestParser()
booking_list_parser.add_argument('flight_id', type=str, help='Filter by flight ID', location='args')
booking_list_parser.add_argument('user_id', type=str, help='Filter by user ID', location='args')
booking_list_parser.add_argument('class_type', type=str, help='Filter by class type', location='args')


@api.route('/')
class BookingList(Resource):
    @jwt_required()
    @api.expect(booking_list_parser)
    def get(self):
        """List bookings with optional filtering"""
        user_id = get_jwt_identity()
        args = booking_list_parser.parse_args()

        # Regular users can only see their own bookings
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)

        query = Booking.query

        if not user.has_role('admin') and not user.has_role('airline-admin'):
            # Regular users can only see their own bookings
            query = query.filter(Booking.user_id == user_id)
        elif user.has_role('airline-admin') and user.airline_id:
            # Airline admins can see bookings for their flights
            query = query.join(Flight).filter(Flight.airline_id == user.airline_id)

        # Apply filters
        if args['flight_id']:
            query = query.filter(Booking.flight_id == args['flight_id'])
        if args['class_type']:
            query = query.filter(Booking.class_type == args['class_type'])
        if args['user_id'] and (user.has_role('admin') or user.has_role('airline-admin')):
            query = query.filter(Booking.user_id == args['user_id'])

        return bookings_schema.dump(query.all()), 200

    @api.expect(booking_model)
    @jwt_required()
    def post(self):
        """Create a new booking"""
        user_id = get_jwt_identity()
        data = request.json

        # Ensure the user is booking for themselves
        data['user_id'] = user_id

        # Validate the flight exists
        flight = Flight.query.get_or_404(data['flight_id'])

        # Check if the seat is available (not already booked)
        if data['seat_number'] in flight.booked_seats():
            return {'error': 'Seat is already booked', 'code': 400}, 400

        # Check if the user has a valid seat session for this seat
        valid_session = SeatSession.query.filter(
            SeatSession.flight_id == data['flight_id'],
            SeatSession.seat_number == data['seat_number'],
            SeatSession.user_id == user_id,
            SeatSession.session_end_time > datetime.datetime.now(datetime.UTC)
        ).first()

        if not valid_session:
            return {'error': 'No valid seat reservation session for this seat', 'code': 400}, 400

        try:
            # Validate data with Marshmallow schema
            result = booking_schema.load(data)

            # Calculate price based on class type
            class_type = data['class_type']
            base_price = 0
            if class_type == 'FIRST':
                base_price = flight.price_first_class
            elif class_type == 'BUSINESS':
                base_price = flight.price_business_class
            elif class_type == 'ECONOMY':
                base_price = flight.price_economy_class

            # Add insurance if selected
            if data.get('is_insurance_purchased', False):
                base_price += flight.price_insurance

            # Set total price
            result.total_price = base_price

            # Set creation timestamp
            result.created_at = datetime.datetime.now(datetime.UTC)

            # Save booking
            db.session.add(result)
            db.session.commit()

            # Delete the seat session as it's no longer needed
            db.session.delete(valid_session)
            db.session.commit()

            return booking_schema.dump(result), 201

        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400


@api.route('/<uuid:booking_id>')
@api.param('booking_id', 'The booking identifier')
class BookingResource(Resource):
    @jwt_required()
    def get(self, booking_id):
        """Fetch a booking given its identifier"""
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)

        booking = Booking.query.get_or_404(booking_id)

        # Check permissions
        if (str(booking.user_id) != user_id and
            not user.has_role('admin') and
            not (user.has_role('airline-admin') and user.airline_id)):
            return {'error': 'You do not have permission to view this booking', 'code': 403}, 403

        # For airline admins, check if booking is for their airline's flight
        if user.has_role('airline-admin') and user.airline_id:
            flight = Flight.query.get(booking.flight_id)
            if flight.airline_id != user.airline_id:
                return {'error': 'You do not have permission to view this booking', 'code': 403}, 403

        return booking_schema.dump(booking), 200

    @api.expect(booking_model)
    @jwt_required()
    def put(self, booking_id):
        """Update a booking given its identifier"""
        user_id = get_jwt_identity()
        booking = Booking.query.get_or_404(booking_id)

        # Check permissions
        if str(booking.user_id) != user_id:
            datastore = current_app.extensions['security'].datastore
            user = datastore.find_user(id=user_id)
            if not user.has_role('admin'):
                return {'error': 'You do not have permission to update this booking', 'code': 403}, 403

        data = request.json

        # Don't allow changing certain fields
        if 'user_id' in data:
            del data['user_id']
        if 'flight_id' in data:
            del data['flight_id']
        if 'created_at' in data:
            del data['created_at']

        try:
            # Validate with Marshmallow schema
            partial_schema = BookingSchema(partial=True)
            validated_data = partial_schema.load(data)

            # Update booking fields
            for key, value in data.items():
                setattr(booking, key, value)

            db.session.commit()
            return booking_schema.dump(booking), 200

        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

    @jwt_required()
    def delete(self, booking_id):
        """Delete a booking given its identifier"""
        user_id = get_jwt_identity()
        booking = Booking.query.get_or_404(booking_id)

        # Check permissions
        if str(booking.user_id) != user_id:
            datastore = current_app.extensions['security'].datastore
            user = datastore.find_user(id=user_id)
            if not user.has_role('admin'):
                return {'error': 'You do not have permission to delete this booking', 'code': 403}, 403

        db.session.delete(booking)
        db.session.commit()

        return {'message': 'Booking deleted successfully'}, 200
