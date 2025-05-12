from flask_restx import Namespace, Resource, fields, marshal, reqparse
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from app.models.airport import Airport
from app.models.location import City, Nation
from app.schemas.airport import airports_schema, airport_schema

api = Namespace('airports', description='Airport related operations')

city_model = api.model('City', {
    'id': fields.Integer(readonly=True, description='City ID'),
    'name': fields.String(required=True, description='City name'),
})

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
    @api.response(200, 'OK', [airport_model])
    @api.response(500, 'Internal Server Error')
    def get(self):
        """List all airports with optional filtering and pagination"""
        args = list_parser.parse_args()
        query = Airport.query.options(
            joinedload(Airport.city).joinedload(City.nation)
        )

        try:
            if args['name']:
                query = query.filter(Airport.name.ilike(f"%{args['name']}%"))
            if args['iata_code']:
                query = query.filter(func.upper(Airport.iata_code) == args['iata_code'].upper())
            if args['icao_code']:
                query = query.filter(func.upper(Airport.icao_code) == args['icao_code'].upper())
            if args['city_name']:
                query = query.join(City).filter(City.name.ilike(f"%{args['city_name']}%"))
            if args['nation_name']:
                if not args['city_name']:
                    query = query.join(City)
                query = query.join(Nation).filter(Nation.name.ilike(f"%{args['nation_name']}%"))

            return marshal(airports_schema.dump(query.all()), airport_model), 200
        except Exception as e:
            return {'error': str(e)}, 500


@api.route('/<int:airport_id>')
@api.param('airport_id', 'The airport identifier')
class AirportResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', airport_model)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    def get(self, airport_id):
        """Fetch an airport given its identifier"""
        airport = Airport.query.options(
            joinedload(Airport.city).joinedload(City.nation)
        ).get_or_404(airport_id)

        return marshal(airport_schema.dump(airport), airport_model), 200
