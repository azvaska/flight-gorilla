
from flask_restx import Namespace, Resource, fields, marshal, reqparse
from app.models.aircraft import Aircraft
from app.schemas.aircraft import aircraft_schema, aircrafts_schema

api = Namespace('aircraft', description='Aircraft related operations')

aircraft_model = api.model('Aircraft', {
    'id': fields.Integer(readonly=True, description='Aircraft ID'),
    'name': fields.String(required=True, description='Aircraft name/model'),
    'rows': fields.Integer(required=True, description='Number of rows'),
    'columns': fields.Integer(required=True, description='Number of columns'),
    'unavailable_seats': fields.List(fields.String, description='List of unavailable seats')
})


aircraft_list_parser = reqparse.RequestParser()
aircraft_list_parser.add_argument('name', type=str, help='Filter by aircraft name/model (case-insensitive)', location='args')

@api.route('/')
class AircraftList(Resource):
    @api.doc(security=None)
    @api.expect(aircraft_list_parser)
    @api.response(200, 'OK', [aircraft_model])
    @api.response(500, 'Internal Server Error')
    def get(self):
        """List all aircraft with optional filtering"""
        args = aircraft_list_parser.parse_args()
        query = Aircraft.query

        if args['name']:
            query = query.filter(Aircraft.name.ilike(f"%{args['name']}%"))

        aircrafts = query.all()

        return marshal(aircrafts_schema.dump(aircrafts), aircraft_model), 200

@api.route('/<int:aircraft_id>')
@api.param('aircraft_id', 'The aircraft identifier')
class AircraftResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK', aircraft_model)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    def get(self, aircraft_id):
        """Fetch an aircraft given its identifier"""
        aircraft = Aircraft.query.get_or_404(aircraft_id)
        return marshal(aircraft_schema.dump(aircraft), aircraft_model), 200

