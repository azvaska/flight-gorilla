# app/apis/airline.py
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse, marshal
from flask_security import hash_password
from marshmallow import ValidationError
from sqlalchemy.orm import joinedload
from app.apis.aircraft import aircraft_model
import datetime

from app.apis.utils import airline_id_from_user, generate_secure_password
from app.core.auth import roles_required
from app.extensions import db
from app.models.airlines import Airline, AirlineAircraft
from app.models.extra import Extra
from app.apis.location import nation_model
from app.models.flight import Route, Flight, FlightExtra
from app.schemas.flight import FlightSchema, flight_schema,all_flights_schema, flight_extra_schema, flights_extra_schema
from app.schemas.airline import AirlineSchema, airline_schema, airlines_schema,route_schema,routes_schema, extra_schema, extras_schema, airline_aircraft_schema, airline_aircrafts_schema
from app.apis.airport import airport_model

api = Namespace('airline', description='Airline related operations')

# --- RESTx Models ---
extra_model = api.model('Extra', {
    'id': fields.String(readonly=True, description='Extra ID'),
    'name': fields.String(required=True, description='Extra name'),
    'description': fields.String(required=True, description='Extra description'),
    'airline_id': fields.String(readonly=True, description='Airline ID'),
    'required_on_all_segments': fields.Boolean(default=False, description='Apply to all flights'),
    'stackable': fields.Boolean(default=False, description='Can be stacked with other extras')
})

airline_aircraft_model = api.model('AirlineAircraft', {
    'id': fields.String(readonly=True, description='Airline Aircraft ID'),
    'aircraft': fields.Nested(aircraft_model, required=True, description='Aircraft'),
    'airline_id': fields.String(readonly=True, description='Airline ID'),
    'first_class_seats': fields.List(fields.String, description='First class seat numbers'),
    'business_class_seats': fields.List(fields.String, description='Business class seat numbers'),
    'economy_class_seats': fields.List(fields.String, description='Economy class seat numbers'),
    'tail_number': fields.String(required=False, description='Aircraft tail number')
})

airline_aircraft_input_model = api.model('AirlineAircraftInput', {
    'aircraft_id': fields.Integer(required=True, description='Aircraft ID'),
    'first_class_seats': fields.List(fields.String, description='First class seat numbers'),
    'business_class_seats': fields.List(fields.String, description='Business class seat numbers'),
    'economy_class_seats': fields.List(fields.String, description='Economy class seat numbers'),
    'tail_number': fields.String(required=False, description='Aircraft tail number')
})

airline_aircraft_put_model = api.model('AirlineAircraftPut', {
    'aircraft_id': fields.Integer(required=False, description='Aircraft ID'),
    'first_class_seats': fields.List(fields.String, description='First class seat numbers'),
    'business_class_seats': fields.List(fields.String, description='Business class seat numbers'),
    'economy_class_seats': fields.List(fields.String, description='Economy class seat numbers'),
    'tail_number': fields.String(required=False, description='Aircraft tail number')
})

airline_model = api.model('Airline', {
    'id': fields.String(readonly=True, description='Airline ID'),
    'name': fields.String(required=True, description='Airline name'),
    'address': fields.String(required=True, description='Airline address'),
    'zip': fields.String(required=True, description='ZIP/postal code'),
    'nation_id': fields.Integer(required=True, description='Nation ID'),
    'nation': fields.Nested(nation_model),
    'email': fields.String(required=True, description='Email address'),
    'website': fields.String(required=True, description='Website URL'),
    'is_approved': fields.Boolean(default=False, description='Approval status'),
    'first_class_description': fields.String(required=True, description='First class description'),
    'business_class_description': fields.String(required=True, description='Business class description'),
    'economy_class_description': fields.String(required=True, description='Economy class description'),
})

airline_put_model = api.model('AirlinePut', {
    'name': fields.String(required=False, description='Airline name'),
    'address': fields.String(required=False, description='Airline address'),
    'zip': fields.String(required=False, description='ZIP/postal code'),
    'nation_id': fields.Integer(required=False, description='Nation ID'),
    'email': fields.String(required=False, description='Email address'),
    'website': fields.String(required=False, description='Website URL'),
    'first_class_description': fields.String(required=False, description='First class description'),
    'business_class_description': fields.String(required=False, description='Business class description'),
    'economy_class_description': fields.String(required=False, description='Economy class description'),
})

admin_credentials_model = api.model('AdminCredentials', {
    'email': fields.String(required=True, description='Airline Admin email'),
    'password': fields.String(required=True, description='Airline Admin password')
})


new_airline_model = api.model('NewAirline', {
    "airline": fields.Nested(airline_model),
    "admin_credentials": fields.Nested(admin_credentials_model)})

route_model = api.model('Route', {
    'id': fields.Integer(readonly=True, description='Route ID'),
    'departure_airport': fields.Nested(airport_model, required=True, description='Departure airport'),
    'arrival_airport': fields.Nested(airport_model, required=True, description='Arrival airport'),
    'airline_id': fields.String(readonly=True, description='Airline ID'),
    'period_start': fields.DateTime(required=True, description='Start of the route period'),
    'period_end': fields.DateTime(required=True, description='End of the route period'),
    'flight_number': fields.String(required=True, description='Flight number')
})

route_input_model = api.model('RouteInput', {
    'departure_airport_id': fields.Integer(required=True, description='Departure airport ID'),
    'arrival_airport_id': fields.Integer(required=True, description='Arrival airport ID'),
    'period_start': fields.DateTime(required=True, description='Start of the route period'),
    'period_end': fields.DateTime(required=True, description='End of the route period'),
    'flight_number': fields.String(required=True, description='Flight number'),
})

route_put_model = api.model('RoutePut', {
    'departure_airport_id': fields.Integer(required=False, description='Departure airport ID'),
    'arrival_airport_id': fields.Integer(required=False, description='Arrival airport ID'),
    'period_start': fields.DateTime(required=False, description='Start of the route period'),
    'period_end': fields.DateTime(required=False, description='End of the route period'),
    'flight_number': fields.String(required=False, description='Flight number'),
})

flight_model_input = api.model('Flight', {
    'route_id': fields.Integer(required=True, description='Route ID'),
    'aircraft_id': fields.String(required=True, description='Airline Aircraft ID'),
    'departure_time': fields.DateTime(required=True, description='Departure time'),
    'arrival_time': fields.DateTime(required=True, description='Arrival time'),
    'price_economy_class': fields.Float(required=True, description='Economy class price'),
    'price_business_class': fields.Float(required=True, description='Business class price'),
    'price_first_class': fields.Float(required=True, description='First class price'),
    'price_insurance': fields.Float(description='Insurance price'),
    'extras': fields.List(fields.Nested(api.model('ExtraItem', {
        'extra_id': fields.String(required=True, description='Extra ID'),
        'price': fields.Float(required=True, description='Price of the extra'),
        'limit': fields.Integer(required=True, description='Limit of the extra'),
    })), required=False, description='List of extras to add to the flight')
})

flight_put_model = api.model('FlightPut', {
    'route_id': fields.Integer(required=False, description='Route ID'),
    'aircraft_id': fields.String(required=False, description='Airline Aircraft ID'),
    'departure_time': fields.DateTime(required=False, description='Departure time'),
    'arrival_time': fields.DateTime(required=False, description='Arrival time'),
    'price_economy_class': fields.Float(required=False, description='Economy class price'),
    'price_business_class': fields.Float(required=False, description='Business class price'),
    'price_first_class': fields.Float(required=False, description='First class price'),
    'price_insurance': fields.Float(required=False, description='Insurance price'),
    'extras': fields.List(fields.Nested(api.model('ExtraItemPut', {
        'extra_id': fields.String(required=True, description='Extra ID'),
        'price': fields.Float(required=True, description='Price of the extra'),
        'limit': fields.Integer(required=True, description='Limit of the extra'),
    })), required=False, description='List of extras to add to the flight')
})

flight_model_output = api.model('AirlineFlightOutput', {
    'id': fields.String(readonly=True, description='Flight ID'),
    'flight_number': fields.String(required=True, description='Flight number'),
    'aircraft': fields.Nested(airline_aircraft_model, description='Aircraft'),
    'route_id': fields.String(readonly=True, description='Route ID'),
    'departure_time': fields.DateTime(required=True, description='Departure time'),
    'arrival_time': fields.DateTime(required=True, description='Arrival time'),
    'departure_airport': fields.Nested(airport_model, description='Departure Airport'),
    'arrival_airport': fields.Nested(airport_model, description='Arrival Airport'),
    'price_first_class': fields.Float(required=True, description='First class price'),
    'price_business_class': fields.Float(required=True, description='Business class price'),
    'price_economy_class': fields.Float(required=True, description='Economy class price'),
    'price_insurance': fields.Float(required=True, description='Insurance price'),
    'gate': fields.String(required=True, description='Gate'),
    'terminal': fields.String(required=True, description='Terminal'),
    'checkin_start_time': fields.DateTime(required=True, description='Checkin start time'),
    'checkin_end_time': fields.DateTime(required=True, description='Checkin end time'),
    'boarding_start_time': fields.DateTime(required=True, description='Boarding start time'),
    'boarding_end_time': fields.DateTime(required=True, description='Boarding end time'),
})


airline_aircraft_minified_model = api.model('AirlineAircraftMinified', {
    "id": fields.String(readonly=True, description='Airline Aircraft ID'),
    "tail_number": fields.String(required=False, description='Aircraft tail number'),
    "aircraft": fields.Nested(aircraft_model, required=True, description='Aircraft')
})


all_flight_output_model = api.model('AllFlightOutput', {
    'id': fields.String(readonly=True, description='Flight ID'),
    'flight_number': fields.String(required=True, description='Flight number'),
    'aircraft': fields.Nested(airline_aircraft_minified_model, description='Aircraft'),
    'route_id': fields.String(readonly=True, description='Route ID'),
    'departure_time': fields.DateTime(required=True, description='Departure time'),
    'arrival_time': fields.DateTime(required=True, description='Arrival time'),
    'departure_airport': fields.Nested(airport_model, description='Departure Airport'),
    'arrival_airport': fields.Nested(airport_model, description='Arrival Airport'),
})

seats_info_model = api.model('SeatsInfo', {
    'first_class_seats': fields.List(fields.String, description='First class seats'),
    'business_class_seats': fields.List(fields.String, description='Business class seats'),
    'economy_class_seats': fields.List(fields.String, description='Economy class seats'),
    'booked_seats': fields.List(fields.String, description='Booked seats'),
})


flight_model_seats_output = api.model('AirlineFlightSeatsOutput', {
    'id': fields.String(readonly=True, description='Flight ID'),
    'flight_number': fields.String(required=True, description='Flight number'),
    'aircraft': fields.Nested(airline_aircraft_model, description='Aircraft'),
    'route_id': fields.String(readonly=True, description='Route ID'),
    'booked_seats': fields.List(fields.String, description='List of booked seats'),
    'departure_time': fields.DateTime(required=True, description='Departure time'),
    'arrival_time': fields.DateTime(required=True, description='Arrival time'),
    'departure_airport': fields.Nested(airport_model, description='Departure Airport'),
    'arrival_airport': fields.Nested(airport_model, description='Arrival Airport'),
    'price_first_class': fields.Float(required=True, description='First class price'),
    'price_business_class': fields.Float(required=True, description='Business class price'),
    'price_economy_class': fields.Float(required=True, description='Economy class price'),
    'price_insurance': fields.Float(required=True, description='Insurance price'),
    'gate': fields.String(required=True, description='Gate'),
    'terminal': fields.String(required=True, description='Terminal'),
    'checkin_start_time': fields.DateTime(required=True, description='Checkin start time'),
    'checkin_end_time': fields.DateTime(required=True, description='Checkin end time'),
    'boarding_start_time': fields.DateTime(required=True, description='Boarding start time'),
    'boarding_end_time': fields.DateTime(required=True, description='Boarding end time'),
})


flights_pagination_model = api.model('FlightsPagination', {
    'items': fields.List(fields.Nested(all_flight_output_model), description='List of flights'),
    'total_pages': fields.Integer(description='Total number of flight pages'),
})





# --- Request Parsers ---
airline_list_parser = reqparse.RequestParser()
airline_list_parser.add_argument('name', type=str, help='Filter by airline name (case-insensitive)', location='args')
airline_list_parser.add_argument('nation_id', type=int, help='Filter by nation ID', location='args')

flight_page_parser = reqparse.RequestParser()
flight_page_parser.add_argument('page_number', type=int, default=1, help='Page number for pagination', location='args')
flight_page_parser.add_argument('limit', type=int, default=10,
                        help='Limit the number of results returned for page', location='args')


@api.route('/all')
class AirlineList(Resource):
    @api.doc(security=None)
    @api.expect(airline_list_parser)
    @api.response(200, 'OK', [airline_model])
    @api.response(500, 'Internal Server Error')
    @api.response(400, 'Bad Request')
    def get(self):
        """List all airlines with optional filtering"""
        args = airline_list_parser.parse_args()

        query = Airline.query.options(
            joinedload(Airline.nation),
        )

        if args['name']:
            query = query.filter(Airline.name.ilike(f"%{args['name']}%"))
        if args['nation_id']:
            query = query.filter(Airline.nation_id == args['nation_id'])
        query = query.filter(Airline.is_approved == True)

        return marshal(airlines_schema.dump(query.all()),airline_model), 200

@api.route('/')
class MyAirline(Resource):
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', airline_model)
    @api.response(404, 'Not Found')
    @api.response(403, 'Unauthorized')
    @roles_required(['airline-admin'])
    def get(self,airline_id):
        """Fetch the airline associated with the current user"""

        airline = Airline.query.options(
            joinedload(Airline.nation),
            joinedload(Airline.extras),
       ).get_or_404(airline_id)

        return marshal(airline_schema.dump(airline),airline_model), 200

@api.route('/<uuid:airline_id>')
@api.param('airline_id', 'The airline identifier')
class AirlineResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', airline_model)
    @api.response(404, 'Not Found')
    def get(self, airline_id):
        """Fetch an airline given its identifier"""
        airline = Airline.query.options(
            joinedload(Airline.nation),
            joinedload(Airline.extras),
       ).get_or_404(airline_id)

        return marshal(airline_schema.dump(airline),airline_model), 200

    @jwt_required()
    @roles_required(['airline-admin'])
    @api.expect(airline_put_model)
    @api.response(200, 'OK', airline_model)
    def put(self, airline_id):
        """Update an airline given its identifier"""
        airline = Airline.query.get_or_404(airline_id)
        data = request.json

        # Check permissions
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)


        # Check if the user is an airline admin and if they are trying to update their own airline
        if user.airline_id != airline_id:
            return {'error': 'You do not have permission to update this airline', 'code': 403}, 403


        partial_schema = AirlineSchema(partial=True)
        try:
            # Validate the incoming data
            _ = partial_schema.load(data,instance=airline)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

        db.session.commit()
        return marshal(airline_schema.dump(airline),airline_model), 200



@api.route('/extras')
class MyAirlineExtrasList(Resource):
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', [extra_model])
    @api.response(404, 'Not Found')
    @api.response(403, 'Unauthorized')
    def get(self, airline_id):
        """Get all extras for the current airline"""
        extras = Extra.query.filter_by(airline_id=airline_id).all()
        return marshal(extras_schema.dump(extras),extra_model), 200

    @api.expect(extra_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(201, 'Created', extra_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    def post(self, airline_id):
        """Add a new extra for the current airline"""
        data = request.json
        try:
            new_extra = extra_schema.load(data)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400
        
        new_extra.airline_id = airline_id
        db.session.add(new_extra)
        db.session.commit()

        return marshal(extra_schema.dump(new_extra),extra_model), 201


@api.route('/extras/<uuid:extra_id>')
@api.param('extra_id', 'The extra identifier')
class ExtraResource(Resource):    
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', extra_model)
    @api.response(404, 'Not Found')
    @api.response(403, 'Unauthorized')
    def get(self, extra_id, airline_id):
        """Get a specific extra"""
        extra = Extra.query.get_or_404(extra_id)
        if extra.airline_id != airline_id:
            return {'error': 'You do not have permission to get this extra', 'code': 403}, 403
        return marshal(extra_schema.dump(extra),extra_model), 200

    @api.expect(extra_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', extra_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def put(self, extra_id, airline_id):
        """Update an extra"""
        extra = Extra.query.get_or_404(extra_id)


        # Check if the user is an airline admin and if they are trying to update an extra for their own airline
        if airline_id != extra.airline_id:
            return {'error': 'You do not have permission to update this extra', 'code': 403}, 403
        # Validate the incoming data
        try:
            data = extra_schema.load(request.json, instance=extra, partial=True)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400
        # Update the extra instance with the new data

        db.session.commit()
        return marshal(extra_schema.dump(extra),extra_model), 200

    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def delete(self, extra_id,airline_id):
        """Delete an extra"""

        extra = Extra.query.get_or_404(extra_id)
        # Check permissions
        if extra.airline_id != airline_id:
            return {'error': 'You do not have permission to delete this extra', 'code': 403}, 403
        db.session.delete(extra)
        db.session.commit()

        return {'message': 'Extra deleted successfully'}, 200

@api.route('/aircrafts')
class MyAirlineAircraftList(Resource):
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', [airline_aircraft_model])
    @api.response(404, 'Not Found')
    def get(self, airline_id):
        """Get all aircraft for the current airline"""
        aircraft = AirlineAircraft.query.filter_by(airline_id=airline_id).all()
        return marshal(airline_aircrafts_schema.dump(aircraft),airline_aircraft_model), 200

    @api.expect(airline_aircraft_input_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(201, 'Created', airline_aircraft_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    @api.response(409, 'Conflict')
    def post(self, airline_id):
        """Add a new aircraft for the current airline"""
        data = request.json
        new_aircraft = AirlineAircraft(
            aircraft_id=data['aircraft_id'],
            airline_id=airline_id,
            tail_number=data['tail_number']
        )

        db.session.add(new_aircraft)
        db.session.commit()

        if 'first_class_seats' in data:
            new_aircraft.first_class_seats = data['first_class_seats']
        if 'business_class_seats' in data:
            new_aircraft.business_class_seats = data['business_class_seats']
        if 'economy_class_seats' in data:
            new_aircraft.economy_class_seats = data['economy_class_seats']
        db.session.commit()
        return marshal(airline_aircraft_schema.dump(new_aircraft),airline_aircraft_model), 201
    
@api.route('/aircrafts/<uuid:aircraft_id>')
@api.param('aircraft_id', 'The Aircraft identifier')
class AirlineAircraftResource(Resource):
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', airline_aircraft_model)
    @api.response(404, 'Not Found')
    @api.response(403, 'Unauthorized')
    def get(self, aircraft_id, airline_id):
        """Get a specific aircraft for an airline"""
        # Check if airline exists
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id).first_or_404()
        if aircraft.airline_id != airline_id:
            return {'error': 'You do not have permission to get this aircraft', 'code': 403}, 403

        return marshal(airline_aircraft_schema.dump(aircraft),airline_aircraft_model), 200
    
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.expect(airline_aircraft_put_model)
    @api.response(200, 'OK', airline_aircraft_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def put(self, aircraft_id, airline_id):
        """Update an aircraft for an airline"""
        # Check if airline exists
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id).first_or_404()
        if aircraft.airline_id != airline_id:
            return {'error': 'You do not have permission to update this aircraft', 'code': 403}, 403

        data = request.json

        if 'aircraft_id' in data:
            aircraft.aircraft_id = data['aircraft_id']
        if 'first_class_seats' in data:
            aircraft.first_class_seats = data['first_class_seats']
        if 'business_class_seats' in data:
            aircraft.business_class_seats = data['business_class_seats']
        if 'economy_class_seats' in data:
            aircraft.economy_class_seats = data['economy_class_seats']
        if 'tail_number' in data:
            aircraft.tail_number = data['tail_number']

        db.session.commit()
        return marshal(airline_aircraft_schema.dump(aircraft),airline_aircraft_model), 200
    
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def delete(self, airline_id, aircraft_id):
        """Delete an aircraft for an airline"""
        # Check if airline exists
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id).first_or_404()
        if aircraft.airline_id != airline_id:
            return {'error': 'You do not have permission to delete this aircraft', 'code': 403}, 403

        db.session.delete(aircraft)
        db.session.commit()

        return {'message': 'Aircraft deleted successfully'}, 200

@api.route('/routes')
class MyAirlineRouteList(Resource):
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', [route_model])
    @api.response(404, 'Not Found')
    def get(self, airline_id):
        """Get all routes for the current airline"""
        route = Route.query.filter_by(airline_id=airline_id).all()
        return marshal(routes_schema.dump(route), route_model), 200
    
    @api.expect(route_input_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(201, 'Created', route_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    def post(self, airline_id):
        """Add a new route for the current airline"""
        data = request.json
        try:
            new_route = route_schema.load(data)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

        new_route.airline_id = airline_id
        db.session.add(new_route)
        db.session.commit()

        return marshal(route_schema.dump(new_route),route_model), 201

@api.route('/routes/<int:route_id>')
@api.param('route_id', 'The route identifier')
class AirlineRouteResource(Resource):
    @api.response(200, 'OK', route_model)
    @api.response(404, 'Not Found')
    @api.response(403, 'Unauthorized')  
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def get(self, route_id, airline_id):
        """Get a specific route for an airline"""
        # Check if airline exists
        route = Route.query.filter_by(id=route_id).first_or_404()
        if route.airline_id != airline_id:
            return {'error': 'You do not have permission to get this route', 'code': 403}, 403
        return marshal(route_schema.dump(route),route_model), 200
    
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.expect(route_put_model, validate=False)
    @api.response(200, 'OK', route_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def put(self, route_id,airline_id):
        """Update a route for an airline"""
        # Check if airline exists
        route = Route.query.filter_by(id=route_id).first_or_404()
        if route.airline_id != airline_id:
            return {'error': 'You do not have permission to update this route', 'code': 403}, 403
        data = request.json
        # Validate the incoming data
        try:
            route = route_schema.load(data, instance=route, partial=True)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400
        # Update the route instance with the new data

        db.session.commit()
        return marshal(route_schema.dump(route),route_model), 200

    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    @api.response(400, 'Bad Request')
    def delete(self, route_id, airline_id):
        """Delete a route for the current airline"""
        try:
            route = Route.query.filter_by(id=route_id).first_or_404()
            
            # Check if route belongs to the airline
            if route.airline_id != airline_id:
                return {'error': 'You do not have permission to delete this route'}, 403

            # Check if the route has associated flights
            if route.flights:
                return {'error': 'Cannot delete route with associated flights'}, 400

            db.session.delete(route)
            db.session.commit()

            return {'message': 'Route deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500

@api.route('/flights')
class MyAirlineFlightsList(Resource):
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.expect(flight_page_parser)
    @api.response(200, 'OK', flights_pagination_model)
    @api.response(404, 'Not Found')
    def get(self, airline_id):
        """Get all flights for the current airline"""
        # Handle pagination parameters
        page_number = request.args.get('page_number', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        if page_number < 1:
            return {'error': 'Page number must be greater than 0'}, 400
        if limit < 1:
            return {'error': 'Limit must be greater than 0'}, 400
        
        # Use database pagination instead of loading all flights
        flights_query = Flight.query.join(Flight.route).filter(Route.airline_id == airline_id)
        
        # Get total count for pagination info
        total_flights = flights_query.count()
        
        if total_flights == 0:
            return {'error': 'No flights found for the current airline'}, 404
        
        # Calculate pagination
        total_pages = (total_flights + limit - 1) // limit
        offset = (page_number - 1) * limit
        
        # Apply pagination at database level
        flights = flights_query.offset(offset).limit(limit).all()
        
        # Serialize the flights
        flight_data = all_flights_schema.dump(flights)
        
        # Return paginated response
        flights_pagination = {
            'items': flight_data,
            'total_pages': total_pages
        }

        return flights_pagination, 200

    @api.expect(flight_model_input)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(201, 'Created', flight_model_output)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Forbidden')
    def post(self, airline_id):
        """Create a new flight for the current airline"""
        data = request.json

        try:
            # Validate that the airline aircraft belongs to the airline
            aircraft = AirlineAircraft.query.get(data['aircraft_id'])
            if not aircraft or str(aircraft.airline_id) != str(airline_id):
                return {"error": "The specified aircraft does not belong to your airline"}, 403
            
            # Extract extras from data before flight creation
            extras_data = data.pop('extras', [])
            
            new_flight = flight_schema.load(data)
            
            if 'price_insurance' not in data:
                new_flight.price_insurance = 0.0
                
            # Calculate default checkin and boarding times
            new_flight.checkin_start_time = new_flight.departure_time - datetime.timedelta(hours=2)
            new_flight.checkin_end_time = new_flight.departure_time - datetime.timedelta(hours=1)
            new_flight.boarding_start_time = new_flight.departure_time - datetime.timedelta(hours=1)
            new_flight.boarding_end_time = new_flight.departure_time

            db.session.add(new_flight)
            db.session.flush()  # Get the flight ID without committing

            # Handle extras if provided
            if extras_data:
                airline = Airline.query.get(airline_id)
                airline_extras = {str(extra.id): extra for extra in airline.extras}

                for extra in extras_data:
                    # Check if extra belongs to airline
                    if extra['extra_id'] not in airline_extras:
                        return {'error': f"Extra {extra['extra_id']} does not belong to airline {airline_id}"}, 403

                    # Get the original extra to check if it's stackable
                    extra_original = airline_extras[extra['extra_id']]
                    
                    # Check if extra is stackable and if limit is appropriate
                    if not extra_original.stackable and extra['limit'] > 1:
                        return {'error': f"Extra {extra_original.name} is not stackable, limit must be 1"}, 400

                    extra_data = {
                        'flight_id': str(new_flight.id),
                        'extra_id': extra['extra_id'],
                        'price': extra['price'],
                        'limit': extra['limit']
                    }
                    
                    new_extra = flight_extra_schema.load(extra_data)
                    db.session.add(new_extra)

            db.session.commit()

            return marshal(flight_schema.dump(new_flight), flight_model_output), 201

        except ValidationError as err:
            return {"error": err.messages}, 400
        except Exception as err:
            print("Error", err)
            return {"error": "Internal server error"}, 500

@api.route('/flights/<uuid:flight_id>')
@api.param('flight_id', 'The flight identifier')
class MyAirlineFlightResource(Resource):
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', flight_model_seats_output)
    @api.response(404, 'Not Found')
    @api.response(403, 'Forbidden')
    def get(self, flight_id, airline_id):
        """Get a specific flight for the current airline"""
        flight = Flight.query.join(Flight.route).filter(
            Flight.id == flight_id,
            Route.airline_id == airline_id
        ).first_or_404()

        flight_dump = flight_schema.dump(flight)
        flight_dump['booked_seats'] = flight.booked_seats
        
        return marshal(flight_dump, flight_model_seats_output), 200

    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.expect(flight_put_model)
    @api.response(200, 'OK', flight_model_output)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Forbidden')
    @api.response(404, 'Not Found')
    def put(self, flight_id, airline_id):
        """Update a flight for the current airline"""
        flight = Flight.query.get_or_404(flight_id)

        # Check if flight belongs to the airline
        if str(flight.airline.id) != str(airline_id):
            return {'error': 'You do not have permission to update this flight'}, 403

        data = request.json

        # Don't allow changing the airline_id
        if 'airline_id' in data:
            del data['airline_id']

        # Extract extras from data before flight update
        extras_data = data.pop('extras', None)

        try:
            # Validate data with Marshmallow schema
            validated_data = flight_schema.load(data, partial=True)

            # Handle extras if provided
            if extras_data is not None:
                # Remove existing extras
                FlightExtra.query.filter_by(flight_id=flight_id).delete()
                
                # Add new extras
                if extras_data:  # Only if extras_data is not empty
                    airline = Airline.query.get(airline_id)
                    airline_extras = {str(extra.id): extra for extra in airline.extras}

                    for extra in extras_data:
                        # Check if extra belongs to airline
                        if extra['extra_id'] not in airline_extras:
                            return {'error': f"Extra {extra['extra_id']} does not belong to airline {airline_id}"}, 403

                        # Get the original extra to check if it's stackable
                        extra_original = airline_extras[extra['extra_id']]
                        
                        # Check if extra is stackable and if limit is appropriate
                        if not extra_original.stackable and extra['limit'] > 1:
                            return {'error': f"Extra {extra_original.name} is not stackable, limit must be 1"}, 400

                        extra_data = {
                            'flight_id': str(flight_id),
                            'extra_id': extra['extra_id'],
                            'price': extra['price'],
                            'limit': extra['limit']
                        }
                        
                        new_extra = flight_extra_schema.load(extra_data)
                        db.session.add(new_extra)

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
    @api.response(404, 'Not Found')
    def delete(self, flight_id, airline_id):
        """Delete a flight for the current airline"""
        try:
            flight = Flight.query.get_or_404(flight_id)

            # Check if flight belongs to the airline
            if str(flight.airline.id) != str(airline_id):
                return {'error': 'You do not have permission to delete this flight'}, 403

            # Check if the flight is in the past
            if flight.departure_time < datetime.datetime.now(datetime.UTC):
                return {'error': 'Cannot delete flights that have already departed'}, 400

            db.session.delete(flight)
            db.session.commit()

            return {'message': 'Flight deleted successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500


