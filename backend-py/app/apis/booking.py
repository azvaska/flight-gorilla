import random
import string
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, marshal, reqparse
from marshmallow import ValidationError
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

from app.apis.flight import flight_model_output
from app.apis.utils import price_from_flight
from app.core.auth import roles_required
from app.extensions import db
from app.models.booking import (
    Booking,
    BookingDepartureFlight,
    BookingReturnFlight,
    BookingFlightExtra,
)
from app.models.common import ClassType
from app.models.flight import Flight, FlightExtra
from app.models.seat_session import SeatSession
from app.schemas.booking import (
    booking_schema,
    booking_output_schema,
    bookings_output_schema,
)

api = Namespace("booking", description="Booking related operations")

# --- RESTx Models ---

extra_model_input = api.model(
    "ExtraInput",
    {
        "id": fields.String(required=True, description="Extra ID"),
        "quantity": fields.Integer(required=True, description="Quantity"),
    },
)

booking_model_input = api.model(
    "BookingInput",
    {
        "session_id": fields.String(required=True, description="Session ID"),
        "departure_flights": fields.List(
            fields.String, required=True, description="Departure flights ID"
        ),
        "return_flights": fields.List(
            fields.String, required=True, description="Return flights ID"
        ),
        "extras": fields.List(
            fields.Nested(extra_model_input), required=True, description="List of extras selected"
        ),
        "has_booking_insurance": fields.Boolean(
            required=True, description="Whether insurance was purchased"
        ),
    },
)

booked_flight_extra_model_output = api.model(
    "BookedFlightExtraOutput",
    {
        "extra_id": fields.String(readonly=True, description="FlightExtra ID"),
        "extra_price": fields.Float(required=True, description="Price"),
        "name": fields.String(required=True, description="Name"),
        "description": fields.String(required=True, description="Description"),
        "quantity": fields.Integer(required=True, description="Quantity"),
    },
)

booked_flight_model_output = api.model(
    "BookedFlightOutput",
    {
        "flight": fields.Nested(flight_model_output, description="Flight"),
        "seat_number": fields.String(required=True, description="Seat number"),
        "class_type": fields.String(
            enum=[e.name for e in ClassType], required=True, description="Class type"
        ),
        "price": fields.Float(required=True, description="Price"),
        "extras": fields.List(
            fields.Nested(booked_flight_extra_model_output),
            description="List of extra service IDs",
        ),
    },
)

booking_model_output = api.model(
    "BookingOutput",
    {
        "id": fields.String(readonly=True, description="Booking ID"),
        "booking_number": fields.String(readonly=True, description="Booking number"),
        "departure_flights": fields.List(
            fields.Nested(booked_flight_model_output), description="Departure flights"
        ),
        "return_flights": fields.List(
            fields.Nested(booked_flight_model_output), description="Return flights"
        ),
        "total_price": fields.Float(required=True, description="Total price"),
        "is_insurance_purchased": fields.Boolean(
            description="Whether insurance was purchased"
        ),
        "insurance_price": fields.Float(required=True, description="Insurance price"),
    },
)

# --- Request Parsers ---
booking_list_parser = reqparse.RequestParser()
booking_list_parser.add_argument(
    "flight_id", type=str, help="Filter by flight ID", location="args"
)
booking_list_parser.add_argument(
    "user_id", type=str, help="Filter by user ID", location="args"
)
booking_list_parser.add_argument(
    "class_type", type=str, help="Filter by class type", location="args"
)

def generate_unique_booking_number(session):
    while True:
        candidate = "".join(random.choices(string.ascii_uppercase, k=6))
        exists = session.query(Booking).filter_by(booking_number=candidate).first()
        if not exists:
            return candidate
        
def check_and_update_flight_capacity(sql_session, flight_id):
    """Check if a flight is fully booked and update the flag"""
    flight = sql_session.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        return
    
    # Get total seats available on the aircraft
    total_seats = (
        len(flight.aircraft.first_class_seats) +
        len(flight.aircraft.business_class_seats) +
        len(flight.aircraft.economy_class_seats)
    )
    
    # Get total booked seats for this flight
    booked_seats_count = len(flight.booked_seats_confirmed)
    
    # Update fully_booked flag
    flight.fully_booked = booked_seats_count >= total_seats
    sql_session.commit()

@api.route("/")
@api.response(500, "Internal Server Error")
class BookingList(Resource):
    @jwt_required()
    @api.expect(booking_list_parser)
    @api.response(200, "OK", [booking_model_output])
    @api.response(403, "Forbidden")
    @api.response(404, "Not Found")
    @api.response(400, "Bad Request")
    def get(self):
        """List bookings with optional filtering"""
        user_id = get_jwt_identity()
        args = booking_list_parser.parse_args()

        # Regular users can only see their own bookings
        datastore = current_app.extensions["security"].datastore
        user = datastore.find_user(id=user_id)

        query = Booking.query

        if not user.has_role("admin") and not user.has_role("airline-admin"):
            # Regular users can only see their own bookings
            query = query.filter(Booking.user_id == user_id)
        elif user.has_role("airline-admin"):
            if not user.airline_id:
                return {"error": "Airline ID is required for airline-admin"}, 400
            # Airline admins can see bookings for their flights
            query = query.join(Flight).filter(Flight.airline_id == user.airline_id)

        # Apply filters
        if args["flight_id"]:
            query = query.filter(Booking.flight_id == args["flight_id"])
        if args["class_type"]:
            query = query.filter(Booking.class_type == args["class_type"])
        if args["user_id"] and (
                user.has_role("admin") or user.has_role("airline-admin")
        ):
            query = query.filter(Booking.user_id == args["user_id"])

        return (
            marshal(bookings_output_schema.dump(query.all()), booking_model_output),
            200,
        )


    @api.expect(booking_model_input)
    @jwt_required()
    @roles_required(["user"])
    @api.response(201, "Created", api.model("BookingCreationResponse", {
        "id": fields.String(readonly=True, description="Booking ID")
    }))
    @api.response(400, "Bad Request")
    @api.response(404, "Not Found")
    def post(self):
        """Create a new booking"""
        # TODO: AGGIUNGERE LOCK TRANZAZIONALE CHE NON VENGA ELIMINATA LA SESSIONEE
        # CHECK SESSION HIJACKING

        user_id = get_jwt_identity()
        data = request.json

        with db.engine.begin() as connection:
            connection.execute(text("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"))

            # Use a new session bound to this connection
            session = sessionmaker(bind=connection)
            sql_session = session()

            try:
                validated_data = booking_schema.load(data)
            except ValidationError as err:
                return {"errors": err.messages}, 400

            seat_session = (
                sql_session.query(SeatSession)
                .filter(
                    SeatSession.id == validated_data["session_id"],
                    SeatSession.user_id == user_id,
                )
                .first()
            )
            if seat_session is None:
                return {
                    "error": "Seat session does not belong to the user",
                    "code": 403,
                }, 403
            all_seats = seat_session.seats
            booking = Booking(
                user_id=user_id,
                payment_confirmed=True,
                has_booking_insurance=validated_data["has_booking_insurance"],
                booking_number=generate_unique_booking_number(sql_session),
            )
            sql_session.add(booking)
            sql_session.commit()

            departure_flights = validated_data["departure_flights"]
            return_flights = validated_data["return_flights"]
            
            extras = validated_data["extras"]

            for flight_id in departure_flights:
                for seat in all_seats:
                    if seat.flight_id == flight_id:
                        flight = (
                            sql_session.query(Flight)
                            .filter(Flight.id == flight_id)
                            .first()
                        )
                        class_type = seat.class_type
                        flight_price = price_from_flight(flight, class_type)
                        booking_flight = BookingDepartureFlight(
                            flight_id=flight_id,
                            booking_id=booking.id,
                            seat_number=seat.seat_number,
                            class_type=class_type,
                            price=flight_price,
                        )
                        sql_session.add(booking_flight)
                        sql_session.flush()
                        check_and_update_flight_capacity(sql_session, flight_id)
                        
                        
                        

            for flight_id in return_flights:
                for seat in all_seats:
                    if seat.flight_id == flight_id:
                        flight = (
                            sql_session.query(Flight)
                            .filter(Flight.id == flight_id)
                            .first()
                        )
                        class_type = seat.class_type
                        flight_price = price_from_flight(flight, class_type)
                        booking_flight = BookingReturnFlight(
                            flight_id=flight_id,
                            booking_id=booking.id,
                            seat_number=seat.seat_number,
                            class_type=class_type,
                            price=flight_price,
                        )
                        sql_session.add(booking_flight)
                        sql_session.flush()
                        check_and_update_flight_capacity(sql_session, flight_id)

            for extra in extras:
                extra_id = extra["id"]
                quantity = extra["quantity"]
                extra_obj = (
                    sql_session.query(FlightExtra)
                    .filter(FlightExtra.id == extra_id)
                    .first()
                )
                if extra_obj:
                    if extra_obj.flight_id not in departure_flights and extra_obj.flight_id not in return_flights:
                        return {
                            "error": "Extra does not belong to the selected flights",
                            "code": 403,
                        }, 403
                        
                    booking_flight_extra = BookingFlightExtra(
                        booking_id=booking.id,
                        flight_id=extra_obj.flight_id,
                        extra_id=extra_obj.id,
                        extra_price=extra_obj.price * quantity,
                        quantity=quantity,
                    )
                    sql_session.add(booking_flight_extra)
            sql_session.commit()
            sql_session.delete(seat_session)
            sql_session.commit()

            return {"id": str(booking.id)}, 201


@api.route("/<uuid:booking_id>")
@api.param("booking_id", "The booking identifier")
class BookingResource(Resource):
    @jwt_required()
    @api.response(200, "OK", booking_model_output)
    @api.response(403, "Forbidden")
    @api.response(404, "Not Found")
    def get(self, booking_id):
        """Fetch a booking given its identifier"""
        user_id = get_jwt_identity()
        datastore = current_app.extensions["security"].datastore
        user = datastore.find_user(id=user_id)

        booking = Booking.query.get_or_404(booking_id)

        # Check permissions
        if (
                str(booking.user_id) != user_id
                and not user.has_role("admin")
                and not (user.has_role("airline-admin") and user.airline_id)
        ):
            return {"error": "You do not have permission to view this booking"}, 403

        # For airline admins, check if booking is for their airline's flight
        if user.has_role("airline-admin") and user.airline_id:
            flight = Flight.query.get(booking.flight_id)
            if flight.airline_id != user.airline_id:
                return {"error": "You do not have permission to view this booking"}, 403

        return marshal(booking_output_schema.dump(booking), booking_model_output), 200

    @jwt_required()
    @api.response(200, "OK")
    @api.response(403, "Forbidden")
    @api.response(404, "Not Found")
    def delete(self, booking_id):
        """Delete a booking given its identifier"""
        user_id = get_jwt_identity()
        booking = Booking.query.get_or_404(booking_id)

        # Check permissions
        if str(booking.user_id) != user_id:
            datastore = current_app.extensions["security"].datastore
            user = datastore.find_user(id=user_id)
            if not user.has_role("admin"):
                return {
                    "error": "You do not have permission to delete this booking",
                    "code": 403,
                }, 403
                
                
                # Collect flight IDs before deletion to update capacity
        flight_ids = set()
        for departure_flight in booking.departure_bookings:
            flight_ids.add(departure_flight.flight_id)
        for return_flight in booking.return_bookings:
            flight_ids.add(return_flight.flight_id)

        db.session.delete(booking)
        db.session.commit()

        # Update flight capacities
        for flight_id in flight_ids:
            check_and_update_flight_capacity(db.session, flight_id)
        
        db.session.commit()
        return {"message": "Booking deleted successfully"}, 200
