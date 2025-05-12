
from flask_restx import Namespace, Resource, fields, reqparse
from datetime import datetime
import uuid

from app.models import Aircraft
from app.models.flight import Flight, Route
from app.models.airport import Airport
from app.models.airlines import Airline, AirlineAircraft

api = Namespace('search', description='Flight search operations')

# --- Request Parser ---
flight_search_parser = reqparse.RequestParser()
flight_search_parser.add_argument('departure_airport', type=int, required=True,
                                 help='Departure airport id', location='args')
flight_search_parser.add_argument('arrival_airport', type=int, required=True,
                                 help='Arrival airport id', location='args')
flight_search_parser.add_argument('departure_date', type=str, required=True,
                                 help='Departure date (YYYY-MM-DD)', location='args')
flight_search_parser.add_argument('return_date', type=str, required=False,
                                 help='Return date (YYYY-MM-DD) for round trips', location='args')
flight_search_parser.add_argument('airline_id', type=str,
                                 help='Filter by specific airline ID', location='args')
flight_search_parser.add_argument('price_max', type=float,
                                 help='Maximum price (economy class)', location='args')
flight_search_parser.add_argument('departure_time_min', type=str,
                                 help='Minimum departure time (HH:MM)', location='args')
flight_search_parser.add_argument('departure_time_max', type=str,
                                 help='Maximum departure time (HH:MM)', location='args')

# --- Flight Search Model (for Swagger UI) ---
flight_search_model = api.model('FlightSearchResults', {
    'id': fields.String(description='Flight ID'),
    'flight_number': fields.String(description='Flight number'),
    'airline_name': fields.String(description='Airline name'),
    'airline_id': fields.String(description='Airline ID'),
    'departure_airport': fields.String(description='Departure airport code'),
    'arrival_airport': fields.String(description='Arrival airport code'),
    'departure_time': fields.DateTime(description='Departure time'),
    'arrival_time': fields.DateTime(description='Arrival time'),
    'duration_minutes': fields.Integer(description='Flight duration in minutes'),
    'price_economy': fields.Float(description='Economy class price'),
    'price_business': fields.Float(description='Business class price'),
    'price_first': fields.Float(description='First class price'),
    'available_economy_seats': fields.Integer(description='Available economy seats'),
    'available_business_seats': fields.Integer(description='Available business seats'),
    'available_first_seats': fields.Integer(description='Available first class seats'),
    'aircraft_name': fields.String(description='Aircraft name'),
    'gate': fields.String(description='Departure gate'),
    'terminal': fields.String(description='Departure terminal'),
})


@api.route('/flights')
class FlightSearch(Resource):
    @api.doc(security=None)
    @api.expect(flight_search_parser)
    def get(self):
        """Search for flights based on departure/arrival airports and date using RAPTOR algorithm"""
        args = flight_search_parser.parse_args()

        # Parse and validate date
        try:
            departure_date = datetime.strptime(args['departure_date'], '%Y-%m-%d').date()
        except ValueError:
            return {'error': 'Invalid departure date format. Use YYYY-MM-DD', 'code': 400}, 400

        # Ensure departure date is not in the past
        if departure_date < datetime.now().date():
            return {'error': 'Departure date cannot be in the past', 'code': 400}, 400

        # Get airports
        departure_airport = Airport.query.filter_by(id=args['departure_airport']).first()
        arrival_airport = Airport.query.filter_by(id=args['arrival_airport']).first()

        if not departure_airport:
            return {'error': f"Departure airport with id {args['departure_airport']} not found", 'code': 404}, 404

        if not arrival_airport:
            return {'error': f"Arrival airport with id {args['arrival_airport']} not found", 'code': 404}, 404

        if departure_airport.id == arrival_airport.id:
            return {'error': "Departure and arrival airports cannot be the same", 'code': 400}, 400

        # Use RAPTOR algorithm to find optimal itineraries
        max_transfers = 3  # Maximum 3 transfers = 4 flight segments
        min_transfer_time = 120  # Minutes
        results = self._raptor_search(
            departure_airport.id,
            arrival_airport.id,
            departure_date,
            max_transfers,
            min_transfer_time,
            args
        )

        # Sort results by total duration
        for k_step in results:
            results[k_step].sort(key=lambda x: x['duration_minutes'])

        print(results)

        return {'results':results }, 200 #flight_search_result_schema.dump(results)

    def _raptor_search(self, origin_id, destination_id, departure_date,
                       max_transfers, min_transfer_minutes, args):
        """
        RAPTOR algorithm extended to enumerate *exactly* k-layover itineraries.
        Returns a dict mapping k transfers -> list of journey results (exactly k layovers).
        """
        from datetime import datetime, timedelta

        # Prepare date window
        start_of_day = datetime.combine(departure_date, datetime.min.time())
        date_min = start_of_day
        date_max = datetime.combine(departure_date + timedelta(days=1), datetime.min.time())

        # Storage for *all* itineraries by exact #transfers
        all_by_transfers = {k: [] for k in range(max_transfers + 1)}

        # We'll use a BFS-like expansion over k transfers
        # frontier_k holds tuples (airport_id, arrival_time, path_so_far) for exactly k transfers
        frontier = [(origin_id, start_of_day, [])]

        for k in range(max_transfers + 1):
            next_frontier = []
            for (current_airport, arrival_time, path) in frontier:
                # Determine minimum departure time (apply transfer buffer only if this isn't first leg)
                min_dep_time = arrival_time
                if path:
                    min_dep_time = arrival_time + timedelta(minutes=min_transfer_minutes)

                # Find flights departing after min_dep_time and within the same travel day
                flights_q = (
                    Flight.query
                    .join(Route, Flight.route_id == Route.id)
                    .filter(
                        Route.departure_airport_id == current_airport,
                        Flight.departure_time >= min_dep_time,
                        Flight.departure_time < date_max
                    )
                )
                flights_q = self._apply_filters(flights_q, departure_date, args)
                possible_flights = flights_q.all()

                for flight in possible_flights:
                    route = Route.query.get(flight.route_id)
                    if not route:
                        continue
                    # Build the new path
                    new_path = path + [flight]
                    dest_airport = route.arrival_airport_id

                    # If this flight reaches the final destination, record it
                    if dest_airport == destination_id:
                        # only record if exactly k transfers (i.e. len(new_path)-1 == k)
                        if len(new_path) - 1 == k:
                            result = self._format_journey_result(new_path, origin_id, destination_id)
                            if result:
                                all_by_transfers[k].append(result)
                                continue

                    # Add to next frontier (for another layover) if we haven't exceeded transfer count
                    if k < max_transfers:
                        next_frontier.append((dest_airport, flight.arrival_time, new_path))

            # Move to the next level of transfers
            frontier = next_frontier

        return all_by_transfers

    def _format_journey_result(self, flight_path, origin_id, destination_id):
        """Format a journey into the expected result format"""
        if not flight_path:
            return None

        # Get first and last flight
        first_flight = flight_path[0]
        last_flight = flight_path[-1]

        # Get origin and destination airports
        origin_airport = Airport.query.get(origin_id)
        destination_airport = Airport.query.get(destination_id)

        if not origin_airport or not destination_airport:
            return None

        # Get first route for airline info
        first_route = Route.query.get(first_flight.route_id)
        if not first_route:
            return None

        # Get airline
        airline = Airline.query.get(first_route.airline_id)

        # Calculate total duration
        total_duration_minutes = int((last_flight.arrival_time - first_flight.departure_time).total_seconds() / 60)

        # Calculate available seats (use first flight's available seats for booking purposes)
        aircraft_instance = AirlineAircraft.query.get(first_flight.aircraft_id)
        if not aircraft_instance:
            return None

        aircraft = Aircraft.query.get(aircraft_instance.aircraft_id)
        if not aircraft:
            return None

        booked_seats = first_flight.booked_seats()
        available_economy = len(aircraft_instance.economy_class_seats) - sum(
            1 for seat in booked_seats if seat in aircraft_instance.economy_class_seats)
        available_business = len(aircraft_instance.business_class_seats) - sum(
            1 for seat in booked_seats if seat in aircraft_instance.business_class_seats)
        available_first = len(aircraft_instance.first_class_seats) - sum(
            1 for seat in booked_seats if seat in aircraft_instance.first_class_seats)

        # Calculate total price
        total_economy_price = sum(flight.price_economy_class for flight in flight_path)
        total_business_price = sum(flight.price_business_class for flight in flight_path)
        total_first_price = sum(flight.price_first_class for flight in flight_path)

        # Create segments
        segments = []
        for i, flight in enumerate(flight_path):
            route = Route.query.get(flight.route_id)
            if not route:
                continue

            departure_airport = Airport.query.get(route.departure_airport_id)
            arrival_airport = Airport.query.get(route.arrival_airport_id)

            if not departure_airport or not arrival_airport:
                continue

            segment = self._process_flight_result(flight, [route], departure_airport, arrival_airport)
            if segment:
                segments.append(segment)

        # Create layover information
        layovers = []
        for i in range(len(flight_path) - 1):
            current_flight = flight_path[i]
            next_flight = flight_path[i + 1]
            current_route = Route.query.get(current_flight.route_id)

            if not current_route:
                continue

            airport = Airport.query.get(current_route.arrival_airport_id)
            if not airport:
                continue

            layover_duration = int((next_flight.departure_time - current_flight.arrival_time).total_seconds() / 60)

            layovers.append({
                'airport': airport.iata_code,
                'duration_minutes': layover_duration
            })

        # Prepare the final result
        result = {
            'id': f"{','.join(str(flight.id) for flight in flight_path)}",
            'flight_number': f"{first_route.flight_number}" + ("+" if len(flight_path) > 1 else ""),
            'airline_name': airline.name if airline else 'Multiple Airlines',
            'airline_id': str(airline.id) if airline else None,
            'departure_airport': origin_airport.iata_code,
            'arrival_airport': destination_airport.iata_code,
            'departure_time': first_flight.departure_time,
            'arrival_time': last_flight.arrival_time,
            'duration_minutes': total_duration_minutes,
            'price_economy': total_economy_price,
            'price_business': total_business_price,
            'price_first': total_first_price,
            'available_economy_seats': available_economy,
            'available_business_seats': available_business,
            'available_first_seats': available_first,
            'aircraft_name': aircraft.name if aircraft else 'Multiple Aircraft',
            'gate': first_flight.gate,
            'terminal': first_flight.terminal,
            'is_direct': len(flight_path) == 1,
            'stops': len(flight_path) - 1,
            'segments': segments,
            'layovers': layovers
        }

        return result

    def _process_flight_result(self, flight, routes, departure_airport, arrival_airport):
        """Process a single flight into result format"""
        # Existing implementation...
        route = next((r for r in routes if r.id == flight.route_id), None)
        if not route:
            return None

        airline = Airline.query.get(route.airline_id)
        aircraft_instance = AirlineAircraft.query.get(flight.aircraft_id)
        if not aircraft_instance:
            return None

        aircraft = Aircraft.query.get(aircraft_instance.aircraft_id)
        if not aircraft:
            return None

        # Calculate available seats
        booked_seats = flight.booked_seats()
        available_economy = len(aircraft_instance.economy_class_seats) - sum(
            1 for seat in booked_seats if seat in aircraft_instance.economy_class_seats)
        available_business = len(aircraft_instance.business_class_seats) - sum(
            1 for seat in booked_seats if seat in aircraft_instance.business_class_seats)
        available_first = len(aircraft_instance.first_class_seats) - sum(
            1 for seat in booked_seats if seat in aircraft_instance.first_class_seats)

        # Calculate flight duration in minutes
        duration_minutes = int((flight.arrival_time - flight.departure_time).total_seconds() / 60)

        result = {
            'id': str(flight.id),
            'flight_number': route.flight_number,
            'airline_name': airline.name if airline else 'Unknown Airline',
            'airline_id': str(airline.id) if airline else None,
            'departure_airport': departure_airport.iata_code,
            'arrival_airport': arrival_airport.iata_code,
            'departure_time': flight.departure_time,
            'arrival_time': flight.arrival_time,
            'duration_minutes': duration_minutes,
            'price_economy': flight.price_economy_class,
            'price_business': flight.price_business_class,
            'price_first': flight.price_first_class,
            'available_economy_seats': available_economy,
            'available_business_seats': available_business,
            'available_first_seats': available_first,
            'aircraft_name': aircraft.name if aircraft else 'Unknown Aircraft',
            'gate': flight.gate,
            'terminal': flight.terminal
        }

        return result

    def _apply_filters(self, flight_query, departure_date, args):
        """Apply common filters to a flight query"""
        # Existing implementation...
        if args['airline_id']:
            try:
                uuid.UUID(args['airline_id'])  # Validate UUID format
                flight_query = flight_query.join(Route).filter(Route.airline_id == args['airline_id'])
            except ValueError:
                pass  # Invalid airline_id will be handled by the caller

        if args['price_max']:
            flight_query = flight_query.filter(Flight.price_economy_class <= args['price_max'])

        if args['departure_time_min']:
            try:
                min_time = datetime.strptime(args['departure_time_min'], '%H:%M').time()
                min_datetime = datetime.combine(departure_date, min_time)
                flight_query = flight_query.filter(Flight.departure_time >= min_datetime)
            except ValueError:
                pass  # Invalid time format will be handled by the caller

        if args['departure_time_max']:
            try:
                max_time = datetime.strptime(args['departure_time_max'], '%H:%M').time()
                max_datetime = datetime.combine(departure_date, max_time)
                flight_query = flight_query.filter(Flight.departure_time <= max_datetime)
            except ValueError:
                pass  # Invalid time format will be handled by the caller

        return flight_query
