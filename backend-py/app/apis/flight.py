from flask import request
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource, fields, marshal
from marshmallow import  ValidationError
from sqlalchemy.orm import joinedload
import datetime
from app.apis.utils import airline_id_from_user
from app.core.auth import roles_required
from app.extensions import db
from app.models.flight import Flight, Route, FlightExtra
from app.models.airlines import AirlineAircraft
from app.schemas.flight import FlightSchema, flight_schema, flight_extra_schema, flights_extra_schema
from app.apis.airport import airport_model

api = Namespace('flight', description='Flight related operations')


airline_model = api.model('FlightAirline', {
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
    'price_first_class': fields.Float(required=True, description='First class price'),
    'price_business_class': fields.Float(required=True, description='Business class price'),
    'price_economy_class': fields.Float(required=True, description='Economy class price'),
    'price_insurance': fields.Float(required=True, description='Insurance price'),
})

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
            joinedload(Flight.route),
        ).get_or_404(flight_id)

        return marshal(flight_schema.dump(flight), flight_model_output), 200

seats_info_model = api.model('SeatsInfo', {
    'first_class_seats': fields.List(fields.String, description='First class seats'),
    'business_class_seats': fields.List(fields.String, description='Business class seats'),
    'economy_class_seats': fields.List(fields.String, description='Economy class seats'),
    'booked_seats': fields.List(fields.String, description='Booked seats'),
})

booked_seats_model = api.model('BookedSeats', {
    'flight_id': fields.String(readonly=True, description='Flight ID'),
    'seats_info': fields.Nested(seats_info_model, description='Seats info'),
    'rows': fields.Integer(description='Rows of the aircraft'),
})

extra_flight_model = api.model('FlightExtra', {
    'id': fields.String(readonly=True, description='Flight Extra ID'),
    'name': fields.String(readonly=True,required=True, description='Name of the extra'),
    'description': fields.String(readonly=True,required=True, description='Description of the extra'),
    'extra_id': fields.String(required=True, description='Extra ID'),
    'price': fields.Float(required=True, description='Price of the extra'),
    'limit': fields.Integer(readonly=True,required=True, description='Limit of the extra'),
    'stackable': fields.Boolean(readonly=True,required=True, description='Is the extra stackable'),
    'required_on_all_segments': fields.Boolean(readonly=True,required=True, description='Is the extra required on all segments'),
})

@api.route('/extra/<uuid:flight_id>')
@api.param('flight_id', 'The flight identifier')
class FlightExtraR(Resource):
    @api.doc(security=None)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    @api.response(200, 'OK', extra_flight_model)
    def get(self, flight_id):
        """Get all extra for a specific flight"""
        q = FlightExtra.query.filter_by(flight_id=flight_id).all()
        if not q:
            return {'error': 'Flight extras not found for the flight'}, 404

        return marshal(flights_extra_schema.dump(q), extra_flight_model), 200

@api.route('/seats/<uuid:flight_id>')
@api.param('flight_id', 'The flight identifier')
class FlightSeats(Resource):
    @api.doc(security=None)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    @api.response(200, 'OK', booked_seats_model)
    def get(self, flight_id):
        """Get all booked seats for a specific flight"""
        flight = Flight.query.get_or_404(flight_id)

        return marshal({
            'flight_id': str(flight.id),
            'seats_info': flight.seats_info,
            'rows': flight.rows
        }, booked_seats_model), 200
