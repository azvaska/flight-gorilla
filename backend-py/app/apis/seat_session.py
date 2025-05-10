from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse
import datetime
from uuid import UUID

from sqlalchemy import text

from app.extensions import db, ma
from app.models.booking import booking_flight_departure, booking_flight_arrival
from app.models.seat_session import SeatSession
from app.models.flight import Flight
from sqlalchemy.exc import IntegrityError

api = Namespace('seat_session', description='Seat reservation session operations')

# --- Marshmallow Schemas ---
class SeatSessionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SeatSession
        load_instance = True
        include_fk = True

    id = ma.UUID(dump_only=True)
    user_id = ma.UUID(required=True)
    flight_id = ma.UUID(required=True)
    session_start_time = ma.DateTime(format='iso')
    session_end_time = ma.DateTime(format='iso')

# Create schema instances
seat_session_schema = SeatSessionSchema()
seat_sessions_schema = SeatSessionSchema(many=True)

# --- RESTx Models ---
seat_session_model = api.model('SeatSession', {
    'id': fields.String(readonly=True, description='Session ID'),
    'user_id': fields.String(readonly=True, description='User ID'),
    'flight_id': fields.String(required=True, description='Flight ID'),
    'seat_number': fields.String(required=True, description='Seat number'),
    'session_start_time': fields.DateTime(readonly=True, description='Session start time'),
    'session_end_time': fields.DateTime(readonly=True, description='Session end time (expiration)'),
})

# --- Request Parsers ---
seat_session_parser = reqparse.RequestParser()
seat_session_parser.add_argument('flight_id', type=str, required=True,
                                help='Flight UUID is required', location='json')
seat_session_parser.add_argument('seat_number', type=str, required=True,
                                help='Seat number is required', location='json')


@api.route('/')
class SeatSessionList(Resource):
    @api.expect(api.model('SeatSessionCreate', {
        'flight_id': fields.String(required=True, description='Flight ID'),
        'seat_number': fields.String(required=True, description='Seat number to reserve')
    }))
    #CATATOIO CONCORRENZA POSTI
    @jwt_required()
    def post(self):
        """Create a new seat reservation session"""
        data = request.json
        user_id = get_jwt_identity()
        flight_id = data['flight_id']
        seat_number = data['seat_number']

        # Start a database transaction with isolation level serializable
        # This ensures that operations are isolated from concurrent transactions
        with db.session.begin_nested():  # Or db.session.begin() for a non-nested TX
            db.session.execute(text("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"))
            try:

                # Check if flight exists
                flight = Flight.query.get(flight_id)
                if not flight:
                    return {'error': 'Flight not found', 'code': 404}, 404
                # Check if seat is in flight's booked_seats array
                if seat_number in flight.booked_seats():
                    return {'error': 'Seat is already booked', 'code': 400}, 400
                existing_sessions = SeatSession.query.filter_by(
                    flight_id=flight_id,
                    seat_number=seat_number
                ).all()
                # Check if the seat is already in an active session
                if existing_sessions:
                    for session in existing_sessions:
                        if session.session_end_time > datetime.datetime.now(datetime.UTC):
                            return {'error': 'Seat is currently reserved by another user', 'code': 409}, 409
                # Set session times
                now = datetime.datetime.now(datetime.UTC)
                session_end = now + datetime.timedelta(minutes=13)  # 13 minute session
                # Create new seat session
                new_session = SeatSession(
                    user_id=user_id,
                    flight_id=flight_id,
                    seat_number=seat_number,
                    session_start_time=now,
                    session_end_time=session_end
                )
                db.session.add(new_session)
                db.session.commit()

                return seat_session_schema.dump(new_session), 201

            except IntegrityError:
                db.session.rollback()
                return {'error': 'Seat is already in use', 'code': 409}, 409


@api.route('/<uuid:session_id>')
@api.param('session_id', 'The seat session identifier')
class SeatSessionResource(Resource):
    @jwt_required()
    @api.marshal_with(seat_session_model)
    def get(self, session_id):
        """Fetch a specific seat session"""
        user_id = get_jwt_identity()

        session = SeatSession.query.get_or_404(session_id)

        # Check if the user owns this session
        if str(session.user_id) != user_id:
            return {'error': 'You do not have permission to view this session'}, 403

        return session, 200

    @jwt_required()
    def delete(self, session_id):
        """Delete (release) a seat session"""
        user_id = get_jwt_identity()

        session = SeatSession.query.get_or_404(session_id)

        # Check if the user owns this session
        if str(session.user_id) != user_id:
            return {'error': 'You do not have permission to delete this session'}, 403

        db.session.delete(session)
        db.session.commit()

        return {'message': 'Seat reservation released successfully'}, 200

