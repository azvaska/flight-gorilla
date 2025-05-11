# app/apis/flight.py
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse
from marshmallow import validates, ValidationError, validate
from sqlalchemy.orm import joinedload
import datetime
import uuid
from sqlalchemy import or_, and_

from app.apis.utils import airline_id_from_user
from app.core.auth import roles_required
from app.extensions import db, ma
from app.models.flight import Flight
from app.models.airlines import Airline
from app.models.airport import Airport
from app.models.aircraft import Aircraft
from app.models.airlines import AirlineAircraft

api = Namespace('flight', description='Flight related operations')

# --- Marshmallow Schemas ---
class FlightSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Flight
        load_instance = True
        include_fk = True

    id = ma.UUID(dump_only=True)
    airline_id = ma.UUID(required=True)
    airline_aircraft_id = ma.UUID(required=True)
    departure_airport_id = ma.Integer(required=True)
    arrival_airport_id = ma.Integer(required=True)
    departure_time = ma.DateTime(required=True)
    arrival_time = ma.DateTime(required=True)
    price_economy_class = ma.Float(required=True)
    price_business_class = ma.Float(required=True)
    price_first_class = ma.Float(required=True)
    price_insurance = ma.Float()
    flight_number = ma.String(required=True)
    departure_airport = ma.Nested('app.apis.airport.AirportSchema', dump_only=True)
    arrival_airport = ma.Nested('app.apis.airport.AirportSchema', dump_only=True)

    @validates('departure_airport_id')
    def validate_departure_airport(self, value):
        if not Airport.query.get(value):
            raise ValidationError("Departure airport with given ID does not exist.")

    @validates('arrival_airport_id')
    def validate_arrival_airport(self, value):
        if not Airport.query.get(value):
            raise ValidationError("Arrival airport with given ID does not exist.")

    @validates('airline_id')
    def validate_airline(self, value):
        if not Airline.query.get(value):
            raise ValidationError("Airline with given ID does not exist.")

    @validates('airline_aircraft_id')
    def validate_airline_aircraft(self, value):
        if not AirlineAircraft.query.get(value):
            raise ValidationError("Airline aircraft with given ID does not exist.")

    @validates('departure_time')
    def validate_departure_time(self, value):
        if value and value < datetime.datetime.now(datetime.UTC):
            raise ValidationError("Departure time cannot be in the past.")

    @validates('arrival_time')
    def validate_arrival_time(self, value, data):
        departure_time = data.get('departure_time')
        if value and departure_time and value <= departure_time:
            raise ValidationError("Arrival time must be after departure time.")

# Create schema instances
flight_schema = FlightSchema()
flights_schema = FlightSchema(many=True)

# --- RESTx Models ---
flight_model = api.model('Flight', {
    'id': fields.String(readonly=True, description='Flight ID'),
    'airline_id': fields.String(required=True, description='Airline ID'),
    'airline_aircraft_id': fields.String(required=True, description='Airline Aircraft ID'),
    'departure_airport_id': fields.Integer(required=True, description='Departure Airport ID'),
    'arrival_airport_id': fields.Integer(required=True, description='Arrival Airport ID'),
    'departure_time': fields.DateTime(required=True, description='Departure time'),
    'arrival_time': fields.DateTime(required=True, description='Arrival time'),
    'price_economy_class': fields.Float(required=True, description='Economy class price'),
    'price_business_class': fields.Float(required=True, description='Business class price'),
    'price_first_class': fields.Float(required=True, description='First class price'),
    'price_insurance': fields.Float(description='Insurance price'),
    'flight_number': fields.String(required=True, description='Flight number')
})

# --- Request Parsers ---
flight_list_parser = reqparse.RequestParser()
flight_list_parser.add_argument('airline_id', type=str, help='Filter by airline ID', location='args')
flight_list_parser.add_argument('departure_airport_id', type=int, help='Filter by departure airport ID', location='args')
flight_list_parser.add_argument('arrival_airport_id', type=int, help='Filter by arrival airport ID', location='args')
flight_list_parser.add_argument('departure_date', type=str, help='Filter by departure date (YYYY-MM-DD)', location='args')
flight_list_parser.add_argument('flight_number', type=str, help='Filter by flight number', location='args')
flight_list_parser.add_argument('future_only', type=bool, default=True, help='Show only future flights', location='args')


@api.route('/')
class FlightList(Resource):
    @api.expect(flight_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def post(self, airline_id):
        """Create a new flight"""
        data = request.json
        data['airline_id'] = airline_id

        try:
            # Validate data with Marshmallow schema
            new_flight = flight_schema.load(data)

            # Set any default values if needed
            if 'price_insurance' not in data:
                new_flight.price_insurance = 0.0

            # Validate that the airline aircraft belongs to the airline
            aircraft = AirlineAircraft.query.get(data['airline_aircraft_id'])
            if not aircraft or str(aircraft.airline_id) != str(airline_id):
                return {"error": "The specified aircraft does not belong to your airline", "code": 400}, 400

            db.session.add(new_flight)
            db.session.commit()

            return flight_schema.dump(new_flight), 201

        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400


@api.route('/<uuid:flight_id>')
@api.param('flight_id', 'The flight identifier')
class FlightResource(Resource):
    @api.doc(security=None)
    def get(self, flight_id):
        """Fetch a flight given its identifier"""
        flight = Flight.query.options(
            joinedload(Flight.departure_airport),
            joinedload(Flight.arrival_airport)
        ).get_or_404(flight_id)

        return flight_schema.dump(flight), 200

    @api.expect(flight_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def put(self, flight_id, airline_id):
        """Update a flight given its identifier"""
        flight = Flight.query.get_or_404(flight_id)

        # Check if flight belongs to the airline
        if str(flight.airline_id) != str(airline_id):
            return {'error': 'You do not have permission to update this flight', 'code': 403}, 403

        data = request.json

        # Don't allow changing the airline_id
        if 'airline_id' in data:
            del data['airline_id']

        try:
            # If the departure time is changed, check that it's not in the past
            if 'departure_time' in data:
                departure_time = datetime.datetime.fromisoformat(data['departure_time'].replace('Z', '+00:00'))
                if departure_time < datetime.datetime.now(datetime.UTC):
                    return {"error": "Departure time cannot be in the past", "code": 400}, 400

            # If the arrival time is changed, check that it's after departure time
            if 'arrival_time' in data and 'departure_time' not in data:
                arrival_time = datetime.datetime.fromisoformat(data['arrival_time'].replace('Z', '+00:00'))
                if arrival_time <= flight.departure_time:
                    return {"error": "Arrival time must be after departure time", "code": 400}, 400
            elif 'arrival_time' in data and 'departure_time' in data:
                arrival_time = datetime.datetime.fromisoformat(data['arrival_time'].replace('Z', '+00:00'))
                departure_time = datetime.datetime.fromisoformat(data['departure_time'].replace('Z', '+00:00'))
                if arrival_time <= departure_time:
                    return {"error": "Arrival time must be after departure time", "code": 400}, 400

            # Validate data with Marshmallow schema
            partial_schema = FlightSchema(partial=True)
            validated_data = partial_schema.load(data)

            # Update flight fields
            for key, value in validated_data.items():
                setattr(flight, key, value)

            db.session.commit()
            return flight_schema.dump(flight), 200

        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def delete(self, flight_id, airline_id):
        """Delete a flight given its identifier"""
        flight = Flight.query.get_or_404(flight_id)

        # Check if flight belongs to the airline
        if str(flight.airline_id) != str(airline_id):
            return {'error': 'You do not have permission to delete this flight', 'code': 403}, 403

        # Check if the flight is in the past
        if flight.departure_time < datetime.datetime.now(datetime.UTC):
            return {'error': 'Cannot delete flights that have already departed', 'code': 400}, 400

        db.session.delete(flight)
        db.session.commit()

        return {'message': 'Flight deleted successfully'}, 200


@api.route('/booked-seats/<uuid:flight_id>')
@api.param('flight_id', 'The flight identifier')
class FlightBookedSeats(Resource):
    @api.doc(security=None)
    def get(self, flight_id):
        """Get all booked seats for a specific flight"""
        flight = Flight.query.get_or_404(flight_id)

        return {
            'flight_id': str(flight.id),
            'booked_seats': flight.booked_seats()
        }, 200