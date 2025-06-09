
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse, marshal
from flask_security import hash_password
from marshmallow import ValidationError
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

api = Namespace('admin', description='Admin related operations')



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

        if data.get('is_approved') is not None:
            airline.is_approved = data['is_approved']
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