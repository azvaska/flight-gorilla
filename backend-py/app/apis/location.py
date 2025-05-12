from flask_restx import Namespace, Resource, fields, marshal, reqparse
from sqlalchemy.orm import joinedload, noload
from app.extensions import db
from app.models import Airport
from app.models.location import City, Nation
from app.schemas.location import nations_schema, cities_schema, nation_schema, city_schema
from app.schemas.airport import airports_schema

api = Namespace('location', description='Location related operations')


nation_model = api.model('Nation', {
    'id': fields.Integer(readonly=True, description='Nation ID'),
    'name': fields.String(required=True, description='Nation name'),
    'code': fields.String(required=True, description='Nation code'),
    'alpha2': fields.String(required=True, description='Nation alpha2 code'),
})

no_nation_city_model = api.model('City', {
    'id': fields.Integer(readonly=True, description='City ID'),
    'name': fields.String(required=True, description='City name'),
})

city_model = api.inherit('City', no_nation_city_model, {
    'nation': fields.Nested(nation_model, description='Associated Nation')
})

location_model = api.model('Location', {
    'id': fields.Integer(required=True, description='Unique identifier'),
    'name': fields.String(required=True, description='Name of the location'),
    'type': fields.String(required=True, description='Type: city, nation, or airport')
})


def str_to_bool(value: str) -> bool:
    if isinstance(value, bool):
        return value
    if value.lower() in {'true', '1', 'yes'}:
        return True
    elif value.lower() in {'false', '0', 'no'}:
        return False
    raise ValueError(f"Invalid boolean value: {value}")


# --- Request Parsers ---
list_parser = reqparse.RequestParser()
list_parser.add_argument('name', type=str, help='Filter by city name (case-insensitive, partial match)',
                         location='args')
list_parser.add_argument('include_nation', type=str_to_bool, default="False", help='Add nation', location='args')

list_parser.add_argument('nation_id', type=str, help='Filter by nation id',
                         location='args')

@api.route('/all')
class LocationsList(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', [location_model])
    @api.response(500, 'Internal Server Error')
    def get(self):
        try:
            """Returns a combined list of cities, nations, and airports."""
            cities = cities_schema.dump(
                db.session.query(City).with_entities(City.id, City.name).all()
            )
            for c in cities:
                c['type'] = 'city'

            nations = nations_schema.dump(
                db.session.query(Nation).with_entities(Nation.id, Nation.name).all()
            )
            for n in nations:
                n['type'] = 'nation'

            airports = airports_schema.dump(
                db.session.query(Airport).with_entities(Airport.id, Airport.name).all()
            )
            for a in airports:
                a['type'] = 'airport'

            combined = cities + nations + airports
            return marshal(combined, location_model), 200
        except Exception as e:
            return {'error': str(e)}, 500

@api.route('/city')
class CityList(Resource):
    @api.expect(list_parser)
    @api.response(200, 'OK', [city_model])
    @api.response(500, 'Internal Server Error')
    def get(self):
        """List all cities with optional filtering and pagination"""
        args = list_parser.parse_args()
        query = City.query.options(noload(City.nation))

        try:
            model = no_nation_city_model

            if args['include_nation']:
                # If include_nation is true, we want to load the nation relationship
                query = City.query.options(joinedload(City.nation))
                model = city_model

            # Apply filters
            if args['name']:
                query = query.filter(City.name.ilike(f"%{args['name']}%"))
            if args['nation_id']:
                query = query.filter(City.nation_id == args['nation_id'])

            cities = query.order_by('name').all()

            return marshal(cities, model), 200
        except Exception as e:
            return {'error': str(e)}, 500


@api.route('/city/<int:city_id>')
@api.param('city_id', 'The city identifier')
class CityResource(Resource):
    @api.response(200, 'OK', city_model)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    def get(self, city_id):
        """Fetch a city given its identifier"""
        city = City.query.options(joinedload(City.nation)).get_or_404(city_id)
        return marshal(city_schema.dump(city), city_model), 200

# --- Request Parsers for Nation ---
nation_list_parser = reqparse.RequestParser()
nation_list_parser.add_argument('name', type=str, help='Filter by nation name (case-insensitive, partial match)',
                         location='args')
nation_list_parser.add_argument('code', type=str, help='Filter by nation code (case-insensitive, partial match)',
                         location='args')
nation_list_parser.add_argument('alpha2', type=str, help='Filter by nation alpha2 code (case-insensitive, exact match)',
                         location='args')


@api.route('/nations')
class NationList(Resource):
    @api.expect(nation_list_parser)
    @api.response(200, 'OK', [nation_model])
    @api.response(500, 'Internal Server Error')
    def get(self):
        """List all nations with optional filtering"""
        args = nation_list_parser.parse_args()
        query = Nation.query

        # Apply filters
        if args['name']:
            query = query.filter(Nation.name.ilike(f"%{args['name']}%"))
        if args['code']:
            query = query.filter(Nation.code.ilike(f"%{args['code']}%"))
        if args['alpha2']:
            query = query.filter(Nation.alpha2.ilike(args['alpha2']))

        nations = query.order_by('name').all()

        return marshal(nations, nation_model), 200


@api.route('/nation/<int:nation_id>')
@api.param('nation_id', 'The nation identifier')
class NationResource(Resource):
    @api.response(200, 'OK', nation_model)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    def get(self, nation_id):
        """Fetch a nation given its identifier"""
        nation = Nation.query.get_or_404(nation_id)

        return marshal(nation_schema.dump(nation), nation_model), 200
