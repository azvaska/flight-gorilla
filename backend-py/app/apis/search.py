
from flask_restx import Namespace, Resource, fields, reqparse, marshal
import datetime
import uuid

from app.models import Aircraft
from app.models.flight import Flight, Route
from app.models.airport import Airport
from app.models.airlines import Airline, AirlineAircraft

api = Namespace('search', description='Flight search operations')
import math

def str_to_bool(value: str) -> bool:
    if isinstance(value, bool):
        return value
    if value.lower() in {'true', '1', 'yes'}:
        return True
    elif value.lower() in {'false', '0', 'no'}:
        return False
    raise ValueError(f"Invalid boolean value: {value}")

# --- Request Parser ---
flight_search_parser = reqparse.RequestParser()
flight_search_parser.add_argument('departure_id', type=int, required=True,
                                 help='Departure id', location='args')
flight_search_parser.add_argument(
    'departure_type',
    type=str,
    choices=('airport', 'city'),
    required=True,
    help='Type of departure location: "airport" or "city"',
    location='args'
)
flight_search_parser.add_argument('arrival_id', type=int, required=True,
                                 help='Arrival id', location='args')
flight_search_parser.add_argument(
    'arrival_type',
    type=str,
    choices=('airport', 'city'),
    required=True,
    help='Type of arrival location: "airport" or "city"',
    location='args'
)
flight_search_parser.add_argument('departure_date', type=str, required=True,
                                 help='Departure date (DD-MM-YYYY)', location='args')
flight_search_parser.add_argument('airline_id', type=str,
                                 help='Filter by specific airline ID', location='args')
flight_search_parser.add_argument('price_max', type=float,
                                 help='Maximum price (economy class)', location='args')
flight_search_parser.add_argument('departure_time_min', type=str,
                                 help='Minimum departure time (HH:MM)', location='args')
flight_search_parser.add_argument('departure_time_max', type=str,
                                 help='Maximum departure time (HH:MM)', location='args')
flight_search_parser.add_argument(
    'order_by',
    type=str,
    choices=('price', 'duration', 'stops'),
    help='Order by field (price_economy, duration_minutes, stops)',
    location='args'
)
flight_search_parser.add_argument('order_by_desc' , type=str_to_bool,
                                    default="False",
                                    help='Order by field descending', location='args')
flight_search_parser.add_argument('page_number', type=int,
                                 help='Pagination offset (for large result sets)', location='args')
flight_search_parser.add_argument('limit', type=int,
                                    help='Limit the number of results returned for page', location='args')












flexible_date_search_parser = reqparse.RequestParser()
flexible_date_search_parser.add_argument('departure_id', type=int, required=True,
                                 help='Departure id', location='args')
flexible_date_search_parser.add_argument(
    'departure_type',
    type=str,
    choices=('airport', 'city'),
    required=True,
    help='Type of departure location: "airport" or "city"',
    location='args'
)
flexible_date_search_parser.add_argument('arrival_id', type=int, required=True,
                                 help='Arrival id', location='args')
flexible_date_search_parser.add_argument(
    'arrival_type',
    type=str,
    choices=('airport', 'city'),
    required=True,
    help='Type of arrival location: "airport" or "city"',
    location='args'
)
flexible_date_search_parser.add_argument('departure_date', type=str, required=True,
                                 help='Departure date (MM-YYYY)', location='args')
flexible_date_search_parser.add_argument('airline_id', type=str,
                                 help='Filter by specific airline ID', location='args')
flexible_date_search_parser.add_argument('price_max', type=float,
                                 help='Maximum price (economy class)', location='args')
flexible_date_search_parser.add_argument('departure_time_min', type=str,
                                 help='Minimum departure time (HH:MM)', location='args')
flexible_date_search_parser.add_argument('departure_time_max', type=str,
                                 help='Maximum departure time (HH:MM)', location='args')
flexible_date_search_parser.add_argument(
    'order_by',
    type=str,
    choices=('price', 'duration', 'stops'),
    help='Order by field (price_economy, duration_minutes, stops)',
    location='args'
)
flexible_date_search_parser.add_argument('order_by_desc' , type=str_to_bool,
                                    default="False",
                                    help='Order by field descending', location='args')
flexible_date_search_parser.add_argument('page_number', type=int,
                                 help='Pagination offset (for large result sets)', location='args')
flexible_date_search_parser.add_argument('limit', type=int,
                                    help='Limit the number of results returned for page', location='args')








# --- Flight Search Model (for Swagger UI) ---


segment_model = api.model('FlightSegment', {
    'id': fields.String(description='Flight segment ID'),
    'flight_number': fields.String(description='Flight number for this segment'),
    'airline_name': fields.String(description='Airline name for this segment'),
    'airline_id': fields.String(description='Airline ID for this segment'),
    'departure_airport': fields.String(description='Departure airport code for this segment'),
    'arrival_airport': fields.String(description='Arrival airport code for this segment'),
    'departure_time': fields.DateTime(description='Departure time for this segment'),
    'arrival_time': fields.DateTime(description='Arrival time for this segment'),
    'duration_minutes': fields.Integer(description='Flight duration in minutes for this segment'),
    'price_economy': fields.Float(description='Economy class price for this segment'),
    'price_business': fields.Float(description='Business class price for this segment'),
    'price_first': fields.Float(description='First class price for this segment'),

    'aircraft_name': fields.String(description='Aircraft name for this segment'),
    'gate': fields.String(description='Departure gate for this segment', allow_null=True),
    'terminal': fields.String(description='Departure terminal for this segment', allow_null=True),
})

layover_model = api.model('Layover', {
    'airport': fields.String(description='Layover airport code'),
    'duration_minutes': fields.Integer(description='Layover duration in minutes'),
})

journey_model = api.model('Journey', {
    'departure_airport': fields.String(description='Origin airport code for the journey'),
    'arrival_airport': fields.String(description='Destination airport code for the journey'),
    'duration_minutes': fields.Integer(description='Total journey duration in minutes'),
    'price_economy': fields.Float(description='Total economy class price for the journey'),
    'price_business': fields.Float(description='Total business class price for the journey'),
    'price_first': fields.Float(description='Total first class price for the journey'),
    'is_direct': fields.Boolean(description='True if the journey is direct, false otherwise'),
    'stops': fields.Integer(description='Number of stops (layovers)'),
    'segments': fields.List(fields.Nested(segment_model), description='List of flight segments in the journey'),
    'layovers': fields.List(fields.Nested(layover_model), description='List of layovers in the journey'),
})

search_output_model = api.model('SearchOutput', {
    'journeys': fields.List(fields.Nested(journey_model), description='List of flight journeys'),
    'total_pages': fields.Integer(description='Total number of pages for pagination'),
})

class SearchFlight:
    def raptor_search(self, origin_id, destination_id, departure_date,
                       max_transfers, min_transfer_minutes, args):
        """
        RAPTOR algorithm extended to enumerate *exactly* k-layover itineraries.
        Returns a dict mapping k transfers -> list of journey results (exactly k layovers).
        Avoids duplicate flight paths unless they have different layovers.
        """


        # Prepare date window
        start_of_day = datetime.datetime.combine(departure_date, datetime.datetime.min.time())
        date_min = start_of_day
        date_max = datetime.datetime.combine(departure_date + datetime.timedelta(days=1), datetime.datetime.min.time())

        # Storage for *all* itineraries by exact #transfers
        all_by_transfers = {k: [] for k in range(max_transfers + 1)}

        # Keep track of processed flight paths to avoid duplicates
        processed_paths = set()

        # We'll use a BFS-like expansion over k transfers
        # frontier_k holds tuples (airport_id, arrival_time, path_so_far) for exactly k transfers
        frontier = [(origin_id, start_of_day, [])]

        for k in range(max_transfers + 1):
            next_frontier = []
            for (current_airport, arrival_time, path) in frontier:
                # Determine minimum departure time (apply transfer buffer only if this isn't first leg)
                min_dep_time = arrival_time
                if path:
                    min_dep_time = arrival_time + datetime.timedelta(minutes=min_transfer_minutes)

                # Find flights departing after min_dep_time and within the same travel day
                flights_q = (
                    Flight.query
                    .join(Route, Flight.route_id == Route.id)
                    .filter(
                        Route.departure_airport_id == current_airport,
                        Flight.departure_time >= min_dep_time,
                        Flight.departure_time < date_max,
                        Flight.fully_booked == False,
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
                        # Only record if exactly k transfers (i.e. len(new_path)-1 == k)
                        if len(new_path) - 1 == k:
                            # Create a unique identifier for this flight path
                            flight_ids = tuple(f.id for f in new_path)

                            # Check if we've already processed this exact combination of flights
                            if flight_ids not in processed_paths:
                                processed_paths.add(flight_ids)
                                result = self._format_journey_result(new_path, origin_id, destination_id)
                                if result:
                                    all_by_transfers[k].append(result)
                                    continue

                    # Check for layover uniqueness
                    if k < max_transfers:
                        # For non-destination flights, create a unique identifier for the path so far
                        # This includes the current flight and the layover airport
                        path_key = (tuple(f.id for f in new_path), dest_airport)
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
            'departure_airport': origin_airport.iata_code,
            'arrival_airport': destination_airport.iata_code,
            'duration_minutes': total_duration_minutes,
            'price_economy': round(total_economy_price,2),
            'price_business': round(total_business_price,2),
            'price_first': round(total_first_price,2),
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
            'price_economy': round(flight.price_economy_class,2),
            'price_business': round(flight.price_business_class,2),
            'price_first': round(flight.price_first_class,2),
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
                min_time = datetime.datetime.strptime(args['departure_time_min'], '%H:%M').time()
                min_datetime = datetime.datetime.combine(departure_date, min_time)
                flight_query = flight_query.filter(Flight.departure_time >= min_datetime)
            except ValueError:
                pass  # Invalid time format will be handled by the caller

        if args['departure_time_max']:
            try:
                max_time = datetime.datetime.strptime(args['departure_time_max'], '%H:%M').time()
                max_datetime = datetime.datetime.combine(departure_date, max_time)
                flight_query = flight_query.filter(Flight.departure_time <= max_datetime)
            except ValueError:
                pass  # Invalid time format will be handled by the caller

        return flight_query



@api.route('/flights')
class FlightSearch(Resource):
    @api.doc(security=None)
    @api.expect(flight_search_parser)
    @api.response(200, 'Created', [search_output_model])
    @api.response(400, 'Bad Request')
    def get(self):
        """Search for flights based on departure/arrival airports and date using RAPTOR algorithm"""
        args = flight_search_parser.parse_args()

        # Parse and validate date
        try:
            departure_date = datetime.datetime.strptime(args['departure_date'], '%d-%m-%Y').date()
        except ValueError:
            return {'error': 'Invalid departure date format. Use DD-MM-YYYY', 'code': 400}, 400

        # Ensure departure date is not in the past
        if departure_date < datetime.datetime.now().date():
            return {'error': 'Departure date cannot be in the past', 'code': 400}, 400

        # Get airports
        departure_journeys = []
        
        if args['departure_type'] == 'airport':
            if not args['departure_id']:
                return {'error': 'Departure airport ID is required', 'code': 400}, 400
            departure_airports = Airport.query.filter_by(id=args['departure_id']).all()
        else:
            if not args['departure_id']:
                return {'error': 'Departure city ID is required', 'code': 400}, 400
            departure_airports = Airport.query.filter_by(city_id=args['departure_id']).all()
        
        if args['arrival_type'] == 'airport':
            if not args['arrival_id']:
                return {'error': 'Arrival airport ID is required', 'code': 400}, 400
            arrival_airports = Airport.query.filter_by(id=args['arrival_id']).all()
        else:
            if not args['arrival_id']:
                return {'error': 'Arrival city ID is required', 'code': 400}, 400
            arrival_airports = Airport.query.filter_by(city_id=args['arrival_id']).all()
            
            
        
        for departure_airport in departure_airports:
            for arrival_airport in arrival_airports:

                # Generate journeys for each departure and arrival airport
                departure_results = generate_journey(
                    departure_airport,
                    arrival_airport,
                    departure_date,
                    args=args
                )
                departure_journeys.extend(departure_results)
        
        # Sort results by total duration
        if args['order_by'] == 'price':
            departure_journeys.sort(key=lambda x: x['price_economy'],reverse=args['order_by_desc'])
        elif args['order_by'] == 'duration':
            departure_journeys.sort(key=lambda x: x['duration_minutes'],reverse=args['order_by_desc'])
        elif args['order_by'] == 'stops':
            departure_journeys.sort(key=lambda x: x['stops'],reverse=args['order_by_desc'])
                
        print(departure_journeys)

        original_len = len(departure_journeys)
        
        
        args['limit'] = args['limit'] if args['limit'] else 10
        #paginate results
        if args['page_number'] and args['limit']:
            start = (args['page_number'] - 1) * args['limit']
            end = start + args['limit']
            if start >= len(departure_journeys) or start < 0:
                departure_journeys = []
            else:
                end = min(end, len(departure_journeys))
                departure_journeys = departure_journeys[start:end]

    

        return marshal({'journeys':departure_journeys,'total_pages':math.ceil(original_len/args['limit'])},search_output_model), 200 #flight_search_result_schema.dump(results)

def generate_journey(departure_airport, arrival_airport, departure_date, max_transfers=3,
                     min_transfer_time=120, args=None):
    resutt = []
    departure_results = SearchFlight().raptor_search(
        departure_airport.id,
        arrival_airport.id,
        departure_date,
        max_transfers,
        min_transfer_time,
        args
    )

    # Sort results by total duration
    for k_step in departure_results:
        resutt.extend(departure_results[k_step])

    return resutt

@api.route('/flexible-dates')
class FlexibleFlightSearch(Resource):
    
    def _calculate_dates(self,date):
        """Calculate the start and end dates for a given month"""
        start_date = datetime.date(date.year, date.month, 1)
        if date.month == 12:
            end_date = datetime.date(date.year + 1, 1, 1) - datetime.timedelta(days=1)
        else:
            end_date = datetime.date(date.year, date.month + 1, 1) - datetime.timedelta(days=1)
        
        date_range = [start_date + datetime.timedelta(days=i) for i in range((end_date - start_date).days + 1)]
        
        return date_range
    
    
    #generare ricerca per nazione -> città 
    @api.doc(security=None)
    @api.expect(flexible_date_search_parser)
    @api.response(200, 'OK')
    def get(self):
        """Get minimum prices for each day in a month for a given departure and arrival airport"""
        args = flexible_date_search_parser.parse_args()

        # Parse and validate date
        try:
            departure_date = datetime.datetime.strptime(args['departure_date'], '%m-%Y').date()
        except ValueError:
            return {'error': 'Invalid departure date format. Use MM', 'code': 400}, 400

        # Get airports
        departure_journeys = []
        
        if args['departure_type'] == 'airport':
            if not args['departure_id']:
                return {'error': 'Departure airport ID is required', 'code': 400}, 400
            departure_airports = Airport.query.filter_by(id=args['departure_id']).all()
        else:
            if not args['departure_id']:
                return {'error': 'Departure city ID is required', 'code': 400}, 400
            departure_airports = Airport.query.filter_by(city_id=args['departure_id']).all()
        
        if args['arrival_type'] == 'airport':
            if not args['arrival_id']:
                return {'error': 'Arrival airport ID is required', 'code': 400}, 400
            arrival_airports = Airport.query.filter_by(id=args['arrival_id']).all()
        else:
            if not args['arrival_id']:
                return {'error': 'Arrival city ID is required', 'code': 400}, 400
            arrival_airports = Airport.query.filter_by(city_id=args['arrival_id']).all()
            
            
        departure_date_range = self._calculate_dates(departure_date)


        result  = []
        # for each day in the range of dates, generate journeys
        for date in departure_date_range:
            journey_departure = []
            for departure_airport in departure_airports:
                for arrival_airport in arrival_airports:

                    # Generate journeys for each departure and arrival airport
                    departure_results = generate_journey(
                        departure_airport,
                        arrival_airport,
                        date,
                        args=args
                    )
                    journey_departure.extend(departure_results)
                    

            journey_departure.sort(key=lambda x: x['price_economy'])
            
            # Get the best price for each day
            best_price = journey_departure[0] if journey_departure else None
            if best_price:
                
                departure_journeys.append(best_price['price_economy'])
            else:
                departure_journeys.append(None)
        
            
        return departure_journeys, 200
