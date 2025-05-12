from flask import request
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource, fields, marshal
from marshmallow import  ValidationError
from sqlalchemy.orm import joinedload
import datetime
from app.apis.utils import airline_id_from_user
from app.core.auth import roles_required
from app.extensions import db
from app.models.flight import Flight, Route
from app.models.airlines import AirlineAircraft
from app.schemas.flight import FlightSchema, flight_schema
from app.apis.airport import airport_model

api = Namespace('flight', description='Flight related operations')

flight_model_input = api.model('Flight', {
    'id': fields.String(readonly=True, description='Flight ID'),
    'route_id': fields.Integer(required=True, description='Route ID'),
    'aircraft_id': fields.String(required=True, description='Airline Aircraft ID'),
    'departure_time': fields.DateTime(required=True, description='Departure time'),
    'arrival_time': fields.DateTime(required=True, description='Arrival time'),
    'price_economy_class': fields.Float(required=True, description='Economy class price'),
    'price_business_class': fields.Float(required=True, description='Business class price'),
    'price_first_class': fields.Float(required=True, description='First class price'),
    'price_insurance': fields.Float(description='Insurance price'),
})

airline_model = api.model('Airline', {
    'id': fields.String(readonly=True, description='Airline ID'),
    'name': fields.String(required=True, description='Airline name'),
    'first_class_description': fields.String(required=True, description='First class description'),
    'business_class_description': fields.String(required=True, description='Business class description'),
    'economy_class_description': fields.String(required=True, description='Economy class description'),
})

flight_model_output = api.model('FlightOutput', {
    'id': fields.String(readonly=True, description='Flight ID'),
    'airline': fields.Nested(airline_model, description='Airline'),
    'flight_number': fields.String(required=True, description='Flight number'),
    'departure_time': fields.DateTime(required=True, description='Departure time'),
    'arrival_time': fields.DateTime(required=True, description='Arrival time'),
    'departure_airport': fields.Nested(airport_model, description='Departure Airport'),
    'arrival_airport': fields.Nested(airport_model, description='Arrival Airport'),
})

@api.route('/')
@api.response(500, 'Internal Server Error')
class FlightList(Resource):
    @api.expect(flight_model_input)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(201, 'Created', flight_model_output)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Forbidden')
    def post(self, airline_id):
        """Create a new flight"""
        data = request.json
        data['airline_id'] = airline_id
        # airline_id = "fe8a8515-a2ec-4569-b8b6-549ae8069ace" #TODO: Hardcoded for tests, change!!

        try:
            # Validate that the airline aircraft belongs to the airline
            aircraft = AirlineAircraft.query.get(data['aircraft_id'])
            if not aircraft or str(aircraft.airline_id) != str(airline_id):
                return {"error": "The specified aircraft does not belong to your airline"}, 403
            
            # Validate that the route belongs to the airline
            route = Route.query.get(data['route_id'])
            if not route or str(route.airline_id) != str(airline_id):
                return {"error": "The specified route does not belong to your airline"}, 403
            
            new_flight = flight_schema.load(data)

            # Set any default values if needed
            if 'price_insurance' not in data:
                new_flight.price_insurance = 0.0
                
            # Calculate default checkin and baording times
            new_flight.checkin_start_time = new_flight.departure_time - datetime.timedelta(hours=2)
            new_flight.checkin_end_time = new_flight.departure_time - datetime.timedelta(hours=1)
            new_flight.boarding_start_time = new_flight.departure_time - datetime.timedelta(hours=1)
            new_flight.boarding_end_time = new_flight.departure_time


            db.session.add(new_flight)
            db.session.commit()

            return marshal(flight_schema.dump(new_flight), flight_model_output), 201

        except ValidationError as err:
            return {"error": err.messages}, 400
        except Exception as err:
            print("Error", err)
            return {"error": "Internal server error"}, 500


@api.route('/<uuid:flight_id>')
@api.param('flight_id', 'The flight identifier')
@api.response(500, 'Internal Server Error')
@api.response(404, 'Not Found')
class FlightResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', flight_model_output)
    def get(self, flight_id):
        """Fetch a flight with nested route and airport/city data"""
        flight = Flight.query.options(
            joinedload(Flight.route)
        ).get_or_404(flight_id)

        return marshal(flight_schema.dump(flight), flight_model_output), 200

    @api.expect(flight_model_input)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', flight_model_output)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Forbidden')
    def put(self, flight_id, airline_id):
        """Update a flight given its identifier"""
        flight = Flight.query.get_or_404(flight_id)

        # Check if flight belongs to the airline
        if str(flight.airline_id) != str(airline_id):
            return {'error': 'You do not have permission to update this flight'}, 403

        data = request.json

        # Don't allow changing the airline_id
        if 'airline_id' in data:
            del data['airline_id']

        try:
            # If the departure time is changed, check that it's not in the past
            if 'departure_time' in data:
                departure_time = datetime.datetime.fromisoformat(data['departure_time'].replace('Z', '+00:00'))
                if departure_time < datetime.datetime.now(datetime.UTC):
                    return {"error": "Departure time cannot be in the past"}, 400

            # If the arrival time is changed, check that it's after departure time
            if 'arrival_time' in data and 'departure_time' not in data:
                arrival_time = datetime.datetime.fromisoformat(data['arrival_time'].replace('Z', '+00:00'))
                if arrival_time <= flight.departure_time:
                    return {"error": "Arrival time must be after departure time"}, 400
            elif 'arrival_time' in data and 'departure_time' in data:
                arrival_time = datetime.datetime.fromisoformat(data['arrival_time'].replace('Z', '+00:00'))
                departure_time = datetime.datetime.fromisoformat(data['departure_time'].replace('Z', '+00:00'))
                if arrival_time <= departure_time:
                    return {"error": "Arrival time must be after departure time"}, 400

            # Validate data with Marshmallow schema
            partial_schema = FlightSchema(partial=True)
            validated_data = partial_schema.load(data)

            # Update flight fields
            for key, value in validated_data.items():
                setattr(flight, key, value)

            db.session.commit()
            return marshal(flight_schema.dump(flight), flight_model_output), 200

        except ValidationError as err:
            return {"errors": err.messages}, 400
        except Exception as e:
            return {"error": str(e)}, 500

    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(403, 'Forbidden')
    @api.response(400, 'Bad Request')
    @api.response(200, 'OK')
    def delete(self, flight_id, airline_id):
        """Delete a flight given its identifier"""
        try:
            flight = Flight.query.get_or_404(flight_id)

            # Check if flight belongs to the airline
            if str(flight.airline_id) != str(airline_id):
                return {'error': 'You do not have permission to delete this flight'}, 403

            # Check if the flight is in the past
            if flight.departure_time < datetime.datetime.now(datetime.UTC):
                return {'error': 'Cannot delete flights that have already departed'}, 400

            db.session.delete(flight)
            db.session.commit()

            return {'message': 'Flight deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

booked_seats_model = api.model('BookedSeats', {
    'flight_id': fields.String(readonly=True, description='Flight ID'),
    'booked_seats': fields.List(fields.String, description='List of booked seats')
})

@api.route('/booked-seats/<uuid:flight_id>')
@api.param('flight_id', 'The flight identifier')
class FlightBookedSeats(Resource):
    @api.doc(security=None)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    @api.response(200, 'OK', booked_seats_model)
    def get(self, flight_id):
        """Get all booked seats for a specific flight"""
        flight = Flight.query.get_or_404(flight_id)

        return marshal({
            'flight_id': str(flight.id),
            'booked_seats': flight.booked_seats
        }, booked_seats_model), 200
