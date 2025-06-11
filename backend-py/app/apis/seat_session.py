from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse, marshal
import datetime
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

from app.core.auth import roles_required
from app.extensions import db
from app.models.airlines import AirlineAircraftSeat
from app.models.booking import ClassType
from app.models.seat_session import SeatSession, Seat
from app.models.flight import Flight
from sqlalchemy.exc import IntegrityError
from app.schemas.seat_session import seat_session_schema

api = Namespace('seat_session', description='Seat reservation session operations')
SESSION_GRAY_TIME = datetime.timedelta(minutes=2)
# --- RESTx Models ---

seat_model = api.model('Seat', {
    'seat_number': fields.String(required=True, description='Seat number'),
    'flight_id': fields.String(required=True, description='Flight ID'),
})

seat_session_model = api.model('SeatSession', {
    'id': fields.String(readonly=True, description='Session ID'),
    'seats': fields.List(fields.Nested(seat_model), description='List of reserved seat numbers'),
    'session_start_time': fields.DateTime(readonly=True, description='Session start time'),
    'session_end_time': fields.DateTime(readonly=True, description='Session end time (expiration)'),
})

# --- Request Parsers ---
seat_session_parser = reqparse.RequestParser()
seat_session_parser.add_argument('session_id', type=str, required=True,
                                help='Session UUID is required', location='json')
seat_session_parser.add_argument('flight_id', type=str, required=True,
                                help='Flight UUID is required', location='json')
seat_session_parser.add_argument('seat_number', type=str, required=True,
                                help='Seat number is required', location='json')


@api.route('/')
class SeatSessionList(Resource):

    @jwt_required()
    @roles_required('user')
    @api.response(404, 'Seat session not found')
    @api.response(200, 'Get seat sessions', seat_session_model)
    def get(self):
        """Create a new seat reservation session"""
        user_id = get_jwt_identity()

        now = datetime.datetime.now(datetime.UTC) + SESSION_GRAY_TIME
        already_session = SeatSession.query.filter(SeatSession.session_end_time > now,
                                                   SeatSession.user_id == user_id).first()
        if already_session is None:
            return {'error': 'You do not have a session',"code":404}, 404

        return marshal(seat_session_schema.dump(already_session), seat_session_model), 201

    #CATATOIO CONCORRENZA POSTI
    @jwt_required()
    @roles_required('user')
    @api.response(404, 'Seat session not found')
    @api.response(201, 'Get new seat sessions', seat_session_model)
    def post(self):
        """Create a new seat reservation session"""
        user_id = get_jwt_identity()

        now = datetime.datetime.now(datetime.UTC)
        session_end = now + datetime.timedelta(minutes=15)  # 15 minute session 13 for the user to book
        already_session = SeatSession.query.filter(SeatSession.session_end_time > now,SeatSession.user_id == user_id).first()
        if already_session is not None:
            db.session.delete(already_session)
            db.session.commit()
            #return {'error': 'You already have an active session'}, 409

        # Create new seat session
        new_session = SeatSession(
            user_id=user_id,
            session_start_time=now,
            session_end_time=session_end
        )
        db.session.add(new_session)
        db.session.commit()

        return marshal(seat_session_schema.dump(new_session),seat_session_model), 201


@api.route('/<uuid:session_id>')
@api.param('session_id', 'The seat session identifier')
class SeatSessionResource(Resource):
    @jwt_required()
    @roles_required(['user'])
    @api.response(200, 'Get session data', seat_session_model)
    @api.response(403, 'Forbidden')
    @api.response(400, 'Bad Request')
    def get(self, session_id):
        """Fetch a specific seat session"""
        user_id = get_jwt_identity()

        session = SeatSession.query.get(session_id)
        if session is None:
            return {'error': 'Seat session not found',"code": 400}, 400

        # Check if the user owns this session
        if str(session.user_id) != user_id:
            return {'error': 'You do not have permission to view this session',"code": 403}, 403

        return marshal(session,seat_session_model), 200

    @jwt_required()
    @roles_required(['user'])
    @api.expect(seat_model)
    @api.response(201, 'OK')
    @api.response(404, 'Seat session not found')
    @api.response(400, 'Bad Request')
    @api.response(409, 'Already booked')
    def post(self,session_id):
        """Update a seat session"""


        user_id = get_jwt_identity()

        session:SeatSession = SeatSession.query.get_or_404(session_id)
        # Check if the user owns this session
        if str(session.user_id) != user_id:
            return {'error': 'You do not have permission to update this session',"code": 403}, 403
        # Check if session is expired
        if session.session_end_time - SESSION_GRAY_TIME < datetime.datetime.now(datetime.UTC) :
            return {'error': 'Session expired', 'code': 400}, 400
        data = request.json

        flight_id = data['flight_id']
        seat_number = data['seat_number']
        with db.engine.begin() as connection:
            connection.execute(text("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"))

            # Use a new session bound to this connection
            Session = sessionmaker(bind=connection)
            sql_session = Session()
            # sql_session.execute(text("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"))

            try:

                # Check if flight exists
                flight = Flight.query.get(flight_id)
                if not flight:
                    return {'error': 'Flight not found', 'code': 404}, 404
                # Check if seat is in flight's booked_seats array
                if seat_number in flight.booked_seats:
                    return {'error': 'Seat is already in use', 'code': 409}, 409

                seat_class = AirlineAircraftSeat.query.filter_by(airline_aircraft_id=flight.aircraft_id,seat_number=seat_number).first()
                if not seat_class:
                    return {'error': 'Seat not found in aircraft', 'code': 404}, 404

                # Create new seat session
                new_seat = Seat(
                    session_id=session.id,
                    seat_number=seat_number,
                    class_type=seat_class.class_type,
                    flight_id=flight.id
                )
                sql_session.add(new_seat)
                sql_session.commit()

                return  {'message': 'Ok','code':201}, 201

            except IntegrityError:
                db.session.rollback()
                return {'error': 'Seat is already in use or seat already selected', 'code': 409}, 409

    @jwt_required()
    @roles_required(['user'])
    @api.response(200, 'OK')
    @api.response(403, 'Forbidden')
    @api.response(400, 'Bad Request')
    @api.response(404, 'Not Found')
    def delete(self, session_id):
        """Delete (release) a seat session"""
        user_id = get_jwt_identity()

        session = SeatSession.query.get(session_id)
        if session is None:
            return {'error': 'Seat session not found', "code": 400}, 400

        # Check if the user owns this session
        if str(session.user_id) != user_id:
            return {'error': 'You do not have permission to delete this session'}, 403
        db.session.delete(session)
        db.session.commit()

        return {'message': 'Ok', "code": 200}, 200

