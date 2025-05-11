# app/apis/airline.py
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse
from marshmallow import validates, ValidationError, validate
from sqlalchemy.orm import joinedload
from uuid import UUID

from sqlalchemy.orm.strategies import JoinedLoader

from app.apis.utils import airline_id_from_user
from app.core.auth import roles_required
from app.extensions import db, ma
from app.models import Nation
from app.models.airlines import Airline, Extra, AirlineAircraft
from app.apis.location import nation_model
from app.models.user import User
from app.schemas.airline import AirlineSchema, airline_schema, airlines_schema, extra_schema, extras_schema, airline_aircraft_schema, airline_aircrafts_schema

api = Namespace('airline', description='Airline related operations')

# --- RESTx Models ---
extra_model = api.model('Extra', {
    'id': fields.String(readonly=True, description='Extra ID'),
    'name': fields.String(required=True, description='Extra name'),
    'description': fields.String(required=True, description='Extra description'),
    'airline_id': fields.String(required=True, description='Airline ID'),
    'all_flights': fields.Boolean(default=False, description='Apply to all flights'),
    'stackable': fields.Boolean(default=False, description='Can be stacked with other extras')
})

airline_aircraft_model = api.model('AirlineAircraft', {
    'id': fields.String(readonly=True, description='Airline Aircraft ID'),
    'aircraft_id': fields.Integer(required=True, description='Aircraft ID'),
    'airline_id': fields.String(required=True, description='Airline ID'),
    'first_class_seats': fields.List(fields.String, description='First class seat numbers'),
    'business_class_seats': fields.List(fields.String, description='Business class seat numbers'),
    'economy_class_seats': fields.List(fields.String, description='Economy class seat numbers'),
    'tail_number': fields.String(required=True, description='Aircraft tail number')
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

# --- Request Parsers ---
airline_list_parser = reqparse.RequestParser()
airline_list_parser.add_argument('name', type=str, help='Filter by airline name (case-insensitive)', location='args')
airline_list_parser.add_argument('nation_id', type=int, help='Filter by nation ID', location='args')
airline_list_parser.add_argument('is_approved', type=bool, help='Filter by approval status', location='args')

@api.route('/')
class AirlineList(Resource):
    @api.doc(security=None)
    @api.expect(airline_list_parser)
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
        if args['is_approved'] is not None:
            query = query.filter(Airline.is_approved == args['is_approved'])

        return airlines_schema.dump(query.all()), 200

    @api.expect(airline_model)
    @jwt_required()
    # @roles_required(['u'])
    def post(self):
        """Create a new airline"""
        data = request.json
        #check if airlines with the same name already exists
        existing_airline = Airline.query.filter_by(name=data['name']).first()
        if existing_airline:
            return {'error': 'Airline with this name already exists', 'code': 400}, 400

        # Create new airline instance
        new_airline = Airline(
            name=data['name'],
            address=data['address'],
            zip=data['zip'],
            nation_id=data['nation_id'],
            email=data['email'],
            website=data['website'],
            is_approved=False,
            first_class_description=data['first_class_description'],
            business_class_description=data['business_class_description'],
            economy_class_description=data['economy_class_description']
        )
        #create a new airline admin account
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)

        db.session.add(new_airline)
        db.session.commit()

        return airline_schema.dump(new_airline), 201

@api.route('/<uuid:airline_id>')
@api.param('airline_id', 'The airline identifier')
class AirlineResource(Resource):
    @api.doc(security=None)
    def get(self, airline_id):
        """Fetch an airline given its identifier"""
        airline = Airline.query.options(
            joinedload(Airline.nation),
            joinedload(Airline.extras),
       ).get_or_404(airline_id)

        return airline_schema.dump(airline), 200

    # @api.expect(airline_model)
    @jwt_required()
    @roles_required(['admin', 'airline-admin'])
    def put(self, airline_id):
        """Update an airline given its identifier"""
        airline = Airline.query.get_or_404(airline_id)
        data = request.json

        # Check permissions
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)
        if not (user.has_role('admin') or user.has_role('airline-admin')):
            return {'error': 'Only administrators can update airlines', 'code': 403}, 403


        partial_schema = AirlineSchema(partial=True)
        try:
            # Validate the incoming data
            validated_data = partial_schema.load(data)
        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

        for key, value in validated_data.items():
            setattr(airline, key, value)

        db.session.commit()
        return airline_schema.dump(airline), 200

    @jwt_required()
    def delete(self, airline_id):
        """Delete an airline given its identifier"""
        # Check permissions
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)

        if not user.has_role('admin'):
            return {'error': 'Only administrators can delete airlines', 'code': 403}, 403

        airline = Airline.query.get_or_404(airline_id)
        db.session.delete(airline)
        db.session.commit()

        return {'message': 'Airline deleted successfully'}, 200

@api.route('/extra')
@api.param('airline_id', 'The airline identifier')
class AirlineExtrasList(Resource):
    @api.doc(security=None)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def get(self, airline_id):
        """Get all extras for a specific airline"""
        # Check if airline exists
        airline = Airline.query.get_or_404(airline_id)
        extras = Extra.query.filter_by(airline_id=airline_id).all()

        return extras_schema.dump(extras), 200

    @api.expect(extra_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def post(self, airline_id):
        """Add a new extra for an airline"""
        # Check if airline exists
        airline = Airline.query.get_or_404(airline_id)

        # Check permissions
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)

        if not (user.has_role('admin') or user.has_role('airline-admin')):
            return {'error': 'Only administrators can add airline extras', 'code': 403}, 403

        data = request.json

        new_extra = Extra(
            name=data['name'],
            description=data['description'],
            airline_id=airline_id,
            all_flights=data.get('all_flights', False),
            stackable=data.get('stackable', False)
        )

        db.session.add(new_extra)
        db.session.commit()

        return extra_schema.dump(new_extra), 201

@api.route('/extras/<uuid:extra_id>')
@api.param('extra_id', 'The extra identifier')
class ExtraResource(Resource):
    @api.doc(security=None)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()

    def get(self, extra_id,airline_id):
        """Get a specific extra"""
        extra = Extra.query.get_or_404(extra_id,airline_id=airline_id)
        return extra_schema.dump(extra), 200

    @api.expect(extra_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def put(self, extra_id,airline_id):
        """Update an extra"""
        extra = Extra.query.get_or_404(extra_id,airline_id=airline_id)

        # Check permissions
        user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(id=user_id)

        if not (user.has_role('admin') or user.has_role('airline-admin')):
            return {'error': 'Only administrators can update extras', 'code': 403}, 403

        data = request.json

        if 'name' in data:
            extra.name = data['name']
        if 'description' in data:
            extra.description = data['description']
        if 'all_flights' in data:
            extra.all_flights = data['all_flights']
        if 'stackable' in data:
            extra.stackable = data['stackable']

        db.session.commit()
        return extra_schema.dump(extra), 200

    @jwt_required()
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def delete(self, extra_id,airline_id):
        """Delete an extra"""

        extra = Extra.query.get_or_404(extra_id,airline_id=airline_id)
        db.session.delete(extra)
        db.session.commit()

        return {'message': 'Extra deleted successfully'}, 200

@api.route('/aircraft')
# @api.param('airline_id', 'The airline identifier')
class AirlineAircraftList(Resource):
    @api.doc(security="JWT")
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def get(self, airline_id):
        """Get all aircraft for a specific airline"""
        # Check if airline exists
        airline = Airline.query.get_or_404(airline_id)
        aircraft = AirlineAircraft.query.filter_by(airline_id=airline_id).all()

        return airline_aircrafts_schema.dump(aircraft), 200

    @api.expect(airline_aircraft_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def post(self, airline_id):
        """Add a new aircraft for an airline"""

        data = request.json

        new_aircraft = AirlineAircraft(
            aircraft_id=data['aircraft_id'],
            airline_id=airline_id,
            first_class_seats=data.get('first_class_seats', []),
            business_class_seats=data.get('business_class_seats', []),
            economy_class_seats=data.get('economy_class_seats', []),
            tail_number=data['tail_number']
        )

        db.session.add(new_aircraft)
        db.session.commit()

        return airline_aircraft_schema.dump(new_aircraft), 201
@api.route('/aircraft/<int:aircraft_id>')
@api.param('aircraft_id', 'The extra identifier')
class AirlineAircraftResource(Resource):
    @api.doc(security="JWT")
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def get(self, airline_id, aircraft_id):
        """Get a specific aircraft for an airline"""
        # Check if airline exists
        airline = Airline.query.get_or_404(airline_id)
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id, airline_id=airline_id).first_or_404()

        return airline_aircraft_schema.dump(aircraft), 200
    @api.expect(airline_aircraft_model)
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def put(self, airline_id, aircraft_id):
        """Update an aircraft for an airline"""
        # Check if airline exists
        airline = Airline.query.get_or_404(airline_id)
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
        return airline_aircraft_schema.dump(aircraft), 200
    @jwt_required()
    @roles_required('airline-admin')
    @airline_id_from_user()
    def delete(self, airline_id, aircraft_id):
        """Delete an aircraft for an airline"""
        # Check if airline exists
        aircraft = AirlineAircraft.query.filter_by(id=aircraft_id, airline_id=airline_id).first_or_404()

        db.session.delete(aircraft)
        db.session.commit()

        return {'message': 'Aircraft deleted successfully'}, 200
