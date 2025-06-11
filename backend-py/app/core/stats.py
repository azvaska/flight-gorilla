import datetime

from flask import current_app
from sqlalchemy import func, distinct, extract, desc, asc, tuple_

from app.extensions import db
from app.models import Flight, AirlineAircraft, Airport
from app.models.airlines import AirlineAircraftSeat
from app.models.booking import BookingReturnFlight, BookingDepartureFlight
from app.models.flight import Route


def calculate_airline_stats(airline_id):
    """Get statistics for the current airline"""
    current_year = datetime.datetime.now().year

    # Create aliases for airports to avoid conflicts
    departure_airport = Airport.__table__.alias('departure_airport')
    arrival_airport = Airport.__table__.alias('arrival_airport')

    # 1. Flights Fulfillment
    fulfillment_query = db.session.query(
        extract('month', Flight.departure_time).label('month'),
        func.count(distinct(AirlineAircraftSeat.seat_number)).label('totalSeats'),
        (func.count(distinct(tuple_(BookingDepartureFlight.booking_id, BookingDepartureFlight.flight_id))) +
         func.count(distinct(tuple_(BookingReturnFlight.booking_id, BookingReturnFlight.flight_id)))).label(
            'total_bookings')
    ).select_from(Flight) \
        .join(Route, Flight.route_id == Route.id) \
        .join(AirlineAircraft, Flight.aircraft_id == AirlineAircraft.id) \
        .join(AirlineAircraftSeat, AirlineAircraft.id == AirlineAircraftSeat.airline_aircraft_id) \
        .outerjoin(BookingDepartureFlight, Flight.id == BookingDepartureFlight.flight_id) \
        .outerjoin(BookingReturnFlight, Flight.id == BookingReturnFlight.flight_id) \
        .filter(
        Route.airline_id == airline_id,
        extract('year', Flight.departure_time) == current_year
    ).group_by(extract('month', Flight.departure_time)).all()

    flights_fulfillment = [
        {
            'month': int(month),
            'totalSeats': int(total_seats or 0),
            'totalBooks': int(total_books or 0)
        }
        for month, total_seats, total_books in fulfillment_query
    ]

    # 2. Revenue - Combined query for both departure and return flights
    revenue_query = db.session.query(
        extract('month', Flight.departure_time).label('month'),
        func.coalesce(func.sum(BookingDepartureFlight.price), 0).label('departure_revenue'),
        func.coalesce(func.sum(BookingReturnFlight.price), 0).label('return_revenue')
    ).select_from(Flight) \
        .join(Route, Flight.route_id == Route.id) \
        .outerjoin(BookingDepartureFlight, Flight.id == BookingDepartureFlight.flight_id) \
        .outerjoin(BookingReturnFlight, Flight.id == BookingReturnFlight.flight_id) \
        .filter(
        Route.airline_id == airline_id,
        extract('year', Flight.departure_time) == current_year
    ).group_by(extract('month', Flight.departure_time)).all()

    revenue = [
        {
            'month': int(month),
            'total': round(float((departure_rev or 0) + (return_rev or 0)), 2)
        }
        for month, departure_rev, return_rev in revenue_query
    ]

    # 3. Most Requested Routes
    # ...existing code...
    # 3. Most Requested Routes - Ranked by booking to seat ratio

    total_seats_route = db.session.query(
        Route.id,
        func.count(AirlineAircraftSeat.seat_number).label('total_seats')
    ).join(Flight, Route.id == Flight.route_id).join(AirlineAircraft, Flight.aircraft_id == AirlineAircraft.id) \
        .join(AirlineAircraftSeat, AirlineAircraft.id == AirlineAircraftSeat.airline_aircraft_id) \
        .filter(Route.airline_id == airline_id) \
        .group_by(Route.id).all()

    bookings_per_route = db.session.query(
        Route.id,
        (func.count(distinct(tuple_(BookingDepartureFlight.booking_id, BookingDepartureFlight.flight_id))) +
         func.count(distinct(tuple_(BookingReturnFlight.booking_id, BookingReturnFlight.flight_id)))).label(
            'total_bookings')
    ).join(Flight, Route.id == Flight.route_id) \
        .outerjoin(BookingDepartureFlight, Flight.id == BookingDepartureFlight.flight_id) \
        .outerjoin(BookingReturnFlight, Flight.id == BookingReturnFlight.flight_id) \
        .filter(Route.airline_id == airline_id) \
        .group_by(Route.id).all()

    # Create a dictionary for quick lookup
    bookings_dict = {row.id: row.total_bookings for row in bookings_per_route}

    # Get route details with airports and flight numbers
    route_details = db.session.query(
        Route.id,
        departure_airport.c.iata_code.label('departure_iata'),
        arrival_airport.c.iata_code.label('arrival_iata')
    ).join(departure_airport, Route.departure_airport_id == departure_airport.c.id) \
        .join(arrival_airport, Route.arrival_airport_id == arrival_airport.c.id) \
        .filter(Route.airline_id == airline_id).all()

    route_details_dict = {
        row.id: {
            'departure_iata': row.departure_iata,
            'arrival_iata': row.arrival_iata
        } for row in route_details
    }

    # Calculate booking ratios and prepare the result
    most_requested_routes_calculated = []
    for route_row in total_seats_route:
        total_seats = route_row.total_seats
        route_id = route_row.id
        total_bookings = bookings_dict.get(route_id, 0)

        # Calculate booking ratio (bookings / total_seats)
        booking_ratio = total_bookings / total_seats if total_seats > 0 else 0

        # Get route details
        if route_id in route_details_dict:
            route_info = route_details_dict[route_id]
            most_requested_routes_calculated.append({
                'airportFrom': route_info['departure_iata'],
                'airportTo': route_info['arrival_iata'],
                'bookings': int(total_bookings),
                'total_seats': int(total_seats),
                'booking_ratio': round(booking_ratio, 3)
            })

    # Sort by booking ratio in descending order and take top 10
    most_requested_routes_calculated.sort(key=lambda x: x['booking_ratio'], reverse=True)
    most_requested_routes_data = most_requested_routes_calculated[:10]

    # 4. Airports with Most Flights
    airport_flights = db.session.query(
        departure_airport.c.iata_code.label('airport'),
        func.count(Flight.id).label('flights')
    ).select_from(Flight) \
        .join(Route, Flight.route_id == Route.id) \
        .join(departure_airport, Route.departure_airport_id == departure_airport.c.id) \
        .filter(Route.airline_id == airline_id) \
        .group_by(departure_airport.c.iata_code) \
        .order_by(desc(func.count(Flight.id))).limit(10).all()

    airports_with_most_flights = [
        {
            'airport': row.airport,
            'flights': int(row.flights)
        }
        for row in airport_flights
    ]

    # 5. Least Used Routes
    least_used_routes = db.session.query(
        departure_airport.c.iata_code.label('airportFrom'),
        arrival_airport.c.iata_code.label('airportTo'),
        func.count(Flight.id).label('flights')
    ).select_from(Route) \
        .join(departure_airport, Route.departure_airport_id == departure_airport.c.id) \
        .join(arrival_airport, Route.arrival_airport_id == arrival_airport.c.id) \
        .join(Flight, Route.id == Flight.route_id) \
        .filter(Route.airline_id == airline_id) \
        .group_by(
        departure_airport.c.iata_code,
        arrival_airport.c.iata_code,
    ).order_by(asc(func.count(Flight.id))).limit(10).all()

    least_used_routes_data = [
        {
            'airportFrom': row.airportFrom,
            'airportTo': row.airportTo,
            'flights': int(row.flights)
        }
        for row in least_used_routes
    ]

    return {
        'flights_fullfilment': flights_fulfillment,
        'revenue': revenue,
        'mostRequestedRoutes': most_requested_routes_data,
        'airportsWithMostFlights': airports_with_most_flights,
        'leastUsedRoute': least_used_routes_data
    }