# app/apis/airport.py
from flask import request
from flask_jwt_extended import jwt_required
from flask_restx import Namespace, Resource, fields, reqparse
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from marshmallow import Schema, fields as ma_fields, ValidationError, validates, validates_schema

from app.apis.location import city_model
from app.extensions import db, ma # Import ma from extensions
from app.models.airport import Airport
from app.models.location import City, Nation

api = Namespace('airports', description='Airport related operations')


class AirportSchema(ma.SQLAlchemyAutoSchema):
    city = ma.Nested('app.apis.location.CitySchema', only=('id', 'name', 'nation'))
    city_id = ma.Integer()

    class Meta:
        model = Airport
        load_instance = True
        fields = ('id', 'name', 'iata_code', 'icao_code', 'latitude', 'longitude', 'city_id', 'city')


# Create schema instances
airport_schema = AirportSchema()
airports_schema = AirportSchema(many=True)

airport_model = api.model('Airport', {
    'id': fields.Integer(readonly=True, description='Airport ID'),
    'name': fields.String(required=True, description='Airport name'),
    'iata_code': fields.String(description='IATA code'),
    'icao_code': fields.String(description='ICAO code'),
    'latitude': fields.Float(required=True, description='Latitude'),
    'longitude': fields.Float(required=True, description='Longitude'),
    'city': fields.Nested(city_model, description='Associated City')
})

# --- Request Parsers ---
list_parser = reqparse.RequestParser()
list_parser.add_argument('name', type=str, help='Filter by airport name (case-insensitive, partial match)', location='args')
list_parser.add_argument('city_name', type=str, help='Filter by city name (case-insensitive, partial match)', location='args')
list_parser.add_argument('nation_name', type=str, help='Filter by nation name (case-insensitive, partial match)', location='args')
list_parser.add_argument('iata_code', type=str, help='Filter by IATA code (case-insensitive)', location='args')
list_parser.add_argument('icao_code', type=str, help='Filter by ICAO code (case-insensitive)', location='args')

@api.route('/')
class AirportList(Resource):
    @api.doc(security=None)
    @api.expect(list_parser)
    @api.marshal_list_with(airport_model)
    def get(self):
        """List all airports with optional filtering and pagination"""
        args = list_parser.parse_args()
        query = Airport.query.options(
            joinedload(Airport.city).joinedload(City.nation)
        )

        # Apply filters (Keep existing logic)
        if args['name']:
            query = query.filter(Airport.name.ilike(f"%{args['name']}%"))
        if args['iata_code']:
            query = query.filter(func.upper(Airport.iata_code) == args['iata_code'].upper())
        if args['icao_code']:
            query = query.filter(func.upper(Airport.icao_code) == args['icao_code'].upper())
        if args['city_name']:
            query = query.join(City).filter(City.name.ilike(f"%{args['city_name']}%"))
        if args['nation_name']:
            if not args['city_name']: # Ensure City is joined
                 query = query.join(City)
            query = query.join(Nation).filter(Nation.name.ilike(f"%{args['nation_name']}%"))


        # Marshmallow can serialize the output if preferred over marshal_list_with
        # return airports_schema.dump(paginated_airports.items), 200
        return airports_schema.dump(query.all()), 200


@api.route('/<int:airport_id>')
@api.param('airport_id', 'The airport identifier')
class AirportResource(Resource):
    @api.doc(security=None)
    @api.marshal_with(airport_model) # Use RESTx model for response doc
    def get(self, airport_id):
        """Fetch an airport given its identifier"""
        airport = Airport.query.options(
            joinedload(Airport.city).joinedload(City.nation)
        ).get_or_404(airport_id)
        # Marshmallow can serialize the output if preferred over marshal_with
        # return airport_schema.dump(airport)
        return airport