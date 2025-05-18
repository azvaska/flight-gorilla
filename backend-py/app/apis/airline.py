# app/apis/airline.py
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse, marshal
from flask_security import hash_password
from marshmallow import ValidationError
from sqlalchemy.orm import joinedload


from app.apis.utils import airline_id_from_user, generate_secure_password
from app.core.auth import roles_required
from app.extensions import db
from app.models.airlines import Airline, AirlineAircraft
from app.models.extra import Extra
from app.apis.location import nation_model
from app.models.flight import Route
from app.schemas.airline import AirlineSchema, airline_schema, airlines_schema,route_schema,routes_schema, extra_schema, extras_schema, airline_aircraft_schema, airline_aircrafts_schema
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
    'aircraft_id': fields.Integer(required=True, description='Aircraft ID'),
    'airline_id': fields.String(readonly=True, description='Airline ID'),
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
    'name': fields.String(required=True, description='Airline name'),
    'address': fields.String(required=True, description='Airline address'),
    'zip': fields.String(required=True, description='ZIP/postal code'),
    'nation_id': fields.Integer(required=True, description='Nation ID'),
    'email': fields.String(required=True, description='Email address'),
    'website': fields.String(required=True, description='Website URL'),
    'first_class_description': fields.String(required=True, description='First class description'),
    'business_class_description': fields.String(required=True, description='Business class description'),
    'economy_class_description': fields.String(required=True, description='Economy class description'),
})

admin_credentials_model = api.model('AdminCredentials', {
    'email': fields.String(required=True, description='Airline Admin email'),
    'password': fields.String(required=True, description='Airline Admin password')
})


new_airline_model = api.model('NewAirline', {
    "airline": fields.Nested(airline_model),
    "admin_credentials": fields.Nested(admin_credentials_model)})

route_model = api.model('Route', {
    'id': fields.String(readonly=True, description='Route ID'),
    'departure_airport_id': fields.String(required=True, description='Departure airport ID'),
    'arrival_airport_id': fields.String(required=True, description='Arrival airport ID'),
    'airline_id': fields.String(readonly=True, description='Airline ID'),
    'period_start': fields.DateTime(required=True, description='Start of the route period'),
    'period_end': fields.DateTime(required=True, description='End of the route period'),
    'flight_number': fields.String(required=True, description='Flight number')
})

# --- Request Parsers ---
airline_list_parser = reqparse.RequestParser()
airline_list_parser.add_argument('name', type=str, help='Filter by airline name (case-insensitive)', location='args')
airline_list_parser.add_argument('nation_id', type=int, help='Filter by nation ID', location='args')
airline_list_parser.add_argument('is_approved', type=bool, help='Filter by approval status', location='args')

@api.route('/')
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

        return marshal(airlines_schema.dump(query.all()),airline_model), 200

    @api.expect(airline_put_model)
    @jwt_required()
    @roles_required(['admin'])
    @api.response(201, 'Created', new_airline_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(500, 'Internal Server Error')
    # @roles_required(['u'])
    def post(self):
        """Create a new airline"""
        data = request.json
        #check if airlines with the same name already exists
        existing_airline = Airline.query.filter_by(name=data['name']).first()
        if existing_airline:
            return {'error': 'Airline with this name already exists', 'code': 400}, 400

        # Validate the incoming data
        try:
            new_airline = airline_schema.load(data)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400
        
        new_airline.is_approved = True

        # Create new airline instance
        db.session.add(new_airline)
        #create a new airline admin account
        datastore = current_app.extensions['security'].datastore
        password_account = generate_secure_password()
        airline_user = datastore.create_user(email=new_airline.email,
                                              password=hash_password(password_account), roles=["airline-admin"],
                                                airline_id=new_airline.id,
                                              name=new_airline.name, surname=new_airline.name)

        datastore.db.session.add(airline_user)
        datastore.db.session.commit()
        db.session.commit()

        return marshal({
        'airline': airline_schema.dump(new_airline),
        'admin_credentials': {
            'email': new_airline.email,
            'password': password_account
        }
    },new_airline_model), 201

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
    @roles_required(['admin', 'airline-admin'])
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
        if user.has_role('airline-admin') and user.airline_id != airline_id:
            return {'error': 'You do not have permission to update this airline', 'code': 403}, 403


        partial_schema = AirlineSchema(partial=True)
        try:
            # Validate the incoming data
            _ = partial_schema.load(data,instance=airline)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

        db.session.commit()
        return marshal(airline_schema.dump(airline),airline_model), 200

    @jwt_required()
    @roles_required('admin')
    @api.response(200, 'OK')
    @api.response(404, 'Not Found')
    def delete(self, airline_id):
        """Delete an airline given its identifier"""
        airline = Airline.query.get_or_404(airline_id)
        db.session.delete(airline)
        db.session.commit()

        return {'message': 'Ok'}, 200
#TODO CONTINUE TESTING
@api.route('/extra/<uuid:airline_id>')
@api.param('airline_id', 'The airline identifier')
class AirlineExtrasList(Resource):
    @api.doc(security=None)
    @jwt_required()
    @api.response(200, 'OK', [extra_model])
    @api.response(404, 'Not Found')
    @api.response(403, 'Unauthorized')
    def get(self, airline_id):
        """Get all extras for a specific airline"""
        # Check if airline exists
        airline = Airline.query.get_or_404(airline_id)
        extras = Extra.query.filter_by(airline_id=airline_id).all()

        return marshal(extras_schema.dump(extras),extra_model), 200

    @api.expect(extra_model)
    @jwt_required()
    @roles_required('airline-admin')
    @api.response(201, 'Created', extra_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    def post(self, airline_id):
        #TODO RETEST CON DB AZZERATO
        """Add a new extra for an airline"""
        # Check if airline exists

        # Check permissions
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)

        data = request.json
        # Validate the incoming data
        try:
            new_extra = extra_schema.load(data)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400
        # Check if the user is an airline admin and if they are trying to add an extra to their own airline
        if user.airline_id != airline_id:
            return {'error': 'You do not have permission to add extras to this airline', 'code': 403}, 403
        
        new_extra.airline_id = airline_id

        db.session.add(new_extra)
        db.session.commit()

        return marshal(extra_schema.dump(new_extra),extra_model), 201

@api.route('/extras/<uuid:extra_id>')
@api.param('extra_id', 'The extra identifier')
class ExtraResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', extra_model)
    @api.response(404, 'Not Found')
    def get(self, extra_id):
        """Get a specific extra"""
        extra = Extra.query.get_or_404(extra_id)
        return marshal(extra_schema.dump(extra),extra_model), 200

    @api.expect(extra_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(200, 'OK', extra_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def put(self, extra_id,airline_id):
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

@api.route('/aircrafts/<uuid:airline_id>')
@api.param('airline_id', 'The airline identifier')
class AirlineAircraftList(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', [airline_aircraft_model])
    @api.response(404, 'Not Found')
    def get(self, airline_id):
        """Get all aircraft for a specific airline"""
        # Check if airline exists
        aircraft = AirlineAircraft.query.filter_by(airline_id=airline_id).all()

        return marshal(airline_aircrafts_schema.dump(aircraft),airline_aircraft_model), 200

    @api.expect(airline_aircraft_model)
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
        """Add a new aircraft for an airline"""

        data = request.json

        # Validate the incoming data
        new_aircraft = AirlineAircraft(
            aircraft_id=data['aircraft_id'],
            airline_id=airline_id,
            tail_number=data['tail_number']
        )

        db.session.add(new_aircraft)
        db.session.commit()
        # Add seats to the aircraft
        if 'first_class_seats' in data:
            new_aircraft.first_class_seats = data['first_class_seats']
        if 'business_class_seats' in data:
            new_aircraft.business_class_seats = data['business_class_seats']
        if 'economy_class_seats' in data:
            new_aircraft.economy_class_seats = data['economy_class_seats']
        db.session.commit()
        return marshal(airline_aircraft_schema.dump(new_aircraft),airline_aircraft_model), 201
    
@api.route('/aircraft/<uuid:aircraft_id>')
@api.param('aircraft_id', 'The Aircraft identifier')
class AirlineAircraftResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', airline_aircraft_model)
    @api.response(404, 'Not Found')
    @api.response(403, 'Unauthorized')
    def get(self, aircraft_id ):
        """Get a specific aircraft for an airline"""
        # Check if airline exists
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id).first_or_404()

        return marshal(airline_aircraft_schema.dump(aircraft),airline_aircraft_model), 200
    
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.expect(airline_aircraft_model, validate=False)
    @api.response(200, 'OK', airline_aircraft_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def put(self, aircraft_id,airline_id):
        """Update an aircraft for an airline"""
        # Check if airline exists
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id, airline_id=airline_id).first_or_404()

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
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id, airline_id=airline_id).first_or_404()

        db.session.delete(aircraft)
        db.session.commit()

        return {'message': 'Aircraft deleted successfully'}, 200

@api.route('/routes/<uuid:airline_id>')
@api.param('airline_id', 'The airline identifier')
class AirlineRouteList(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', [route_model])
    @api.response(404, 'Not Found')
    def get(self, airline_id):
        """Get all routes for a specific airline"""
        # Check if airline exists
        route = Route.query.filter_by(airline_id=airline_id).all()

        return routes_schema.dump(route), 200
    
    @api.expect(route_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.response(201, 'Created', route_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    def post(self, airline_id):
        """Add a new route for an airline"""
        # Check if airline exists
        
        data = request.json

        # Validate the incoming data
        try:
            new_route = route_schema.load(data)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

        new_route.airline_id = airline_id

        db.session.add(new_route)
        db.session.commit()

        return marshal(route_schema.dump(new_route),route_model), 201
@api.route('/route/<int:route_id>')
@api.param('route_id', 'The route identifier')
class AirlineRouteResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', route_model)
    @api.response(404, 'Not Found')
    def get(self, route_id):
        """Get a specific route for an airline"""
        # Check if airline exists
        route = Route.query.filter_by(id=route_id).first_or_404()

        return marshal(route_schema.dump(route),route_model), 200
    
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    @api.expect(route_model, validate=False)
    @api.response(200, 'OK', route_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Unauthorized')
    @api.response(404, 'Not Found')
    def put(self, route_id,airline_id):
        """Update a route for an airline"""
        # Check if airline exists
        route = Route.query.filter_by(id=route_id, airline_id=airline_id).first_or_404()

        data = request.json
        # Validate the incoming data
        try:
            route = route_schema.load(data, instance=route, partial=True)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400
        # Update the route instance with the new data

        db.session.commit()
        return marshal(route_schema.dump(route),route_model), 200
