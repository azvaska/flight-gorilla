from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse, marshal
from flask_security import hash_password
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from app.apis.aircraft import aircraft_model
import datetime

from app.apis.airline import airline_model, airline_put_model
from app.apis.utils import airline_id_from_user, generate_secure_password
from app.core.auth import roles_required
from app.extensions import db
from app.models.airlines import Airline, AirlineAircraft
from app.models.extra import Extra
from app.apis.location import nation_model
from app.models.flight import Route, Flight, FlightExtra
from app.schemas.flight import FlightSchema, flight_schema, flight_extra_schema, flights_extra_schema
from app.schemas.airline import AirlineSchema, airline_schema, airlines_schema,route_schema,routes_schema, extra_schema, extras_schema, airline_aircraft_schema, airline_aircrafts_schema
from app.apis.airport import airport_model
from app.apis.user import user_list_parser, user_output_model
from app.models.user import User
from app.schemas.user import users_schema, user_schema

api = Namespace('admin', description='Admin related operations')

user_model = api.model('User', {
    'id': fields.String(readonly=True, description='User ID'),
    'email': fields.String(required=True, description='Email address'),
    'name': fields.String(required=True, description='First name'),
    'surname': fields.String(required=True, description='Last name'),
    'address': fields.String(description='Address'),
    'zip': fields.String(description='ZIP/postal code'),
    'nation': fields.Nested(nation_model, description='Nation'),
    'active': fields.Boolean(description='Account active status'),
    'type': fields.String(required=True, description='User type (airline or user)',enum=['airline','user']),
})

# Modello per l'output delle airlines con utenti
airline_with_users_model = api.model('AirlineWithUsers', {
    'id': fields.String(readonly=True, description='Airline ID'),
    'name': fields.String(required=True, description='Airline name'),
    'nation': fields.Nested(nation_model, description='Nation'),
    'address': fields.String(description='Address'),
    'zip': fields.String(description='ZIP code'),
    'email': fields.String(description='Email'),
    'website': fields.String(description='Website'),
    'first_class_description': fields.String(description='First class description'),
    'business_class_description': fields.String(description='Business class description'),
    'economy_class_description': fields.String(description='Economy class description'),
    'user': fields.Nested(user_model, description='User associated with this airline')
})



@api.route('/airlines')
class AirlinesList(Resource):
    @jwt_required()
    @roles_required(['admin'])
    @api.response(200, 'OK', [airline_with_users_model])
    @api.response(403, 'Forbidden')
    @api.response(500, 'Internal Server Error')
    def get(self):
        """List all airlines with their associated user (admin only)"""
        # Query tutte le airlines con le relazioni necessarie
        airlines = Airline.query.options(
            joinedload(Airline.nation)
        ).all()
        
        result = []
        for airline in airlines:
            # Per ogni airline, trova il primo utente associato
            user = User.query.filter(User.airline_id == airline.id).options(
                joinedload(User.nation)
            ).first()
            
            # Serializza l'airline
            airline_data = airline_schema.dump(airline)
            
            # Serializza l'utente (se esiste)
            user_data = user_schema.dump(user) if user else None
            
            # Combina i dati
            airline_with_user = {
                **airline_data,
                'user': user_data
            }
            
            result.append(airline_with_user)
        
        return marshal(result, airline_with_users_model), 200   




@api.route('/airlines/<uuid:airline_id>')
@api.param('airline_id', 'The airline identifier')
class AirlineResource(Resource):
    @jwt_required()
    @roles_required(['admin'])
    @api.expect(airline_put_model)
    @api.response(200, 'OK', airline_model)
    def put(self, airline_id):
        """Update an airline given its identifier"""
        airline = Airline.query.get_or_404(airline_id)
        data = request.json


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

        # Delete all users associated with the airline  
        users = User.query.filter(User.airline_id == airline_id).all()
        for user in users:
            try:
                db.session.delete(user)
                db.session.commit()
                db.session.delete(airline)
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                return {'error': 'The airline has still some dependency'}, 409
        return {'message': 'Ok'}, 200
    

@api.route('/users')
class UserList(Resource):
    @jwt_required()
    @roles_required(['admin'])
    @api.expect(user_list_parser)
    @api.response(200, 'OK', user_output_model)
    @api.response(403, 'Forbidden')
    @api.response(500, 'Internal Server Error')
    def get(self):
        """List all users with optional filtering (admin only)"""
        current_user_id = get_jwt_identity()
        args = user_list_parser.parse_args()

        query = User.query.filter(User.id != current_user_id)

        if args['email']:
            query = query.filter(User.email.ilike(f"%{args['email']}%"))
        if args['name']:
            query = query.filter(User.name.ilike(f"%{args['name']}%"))
        if args['active'] is not None:
            query = query.filter(User.active == args['active'])
        if args['role']:
            query = query.join(User.roles).filter(User.roles.any(name=args['role']))

        return marshal(users_schema.dump(query.all()),user_output_model), 200   

@api.route('/users/<uuid:user_id>')
@api.param('user_id', 'The user identifier')
class UserResource(Resource):
    @jwt_required()
    @roles_required(['admin'])
    def delete(self, user_id):
        """Delete a user given its identifier (admin only)"""
        user = User.query.get_or_404(user_id)

        # Prevent deleting the last admin
        if user.has_role('admin'):
            admin_count = User.query.join(User.roles).filter(User.roles.any(name='admin')).count()
            if admin_count <= 1:
                return {'error': 'Cannot delete the last admin user', 'code': 409}, 409

        # Do not delete if an airline is associated to the user
        if user.airline_id:
            return {'error': 'Cannot delete a user with an associated airline', 'code': 409}, 409

        db.session.delete(user)
        db.session.commit()

        return {'message': 'User deleted successfully'}, 200
