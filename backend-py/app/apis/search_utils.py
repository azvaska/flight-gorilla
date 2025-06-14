import datetime
import uuid
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict

from app.models import Aircraft, Nation, City
from app.models.airlines import Airline, AirlineAircraft
from app.models.airport import Airport
from app.models.booking import BookingDepartureFlight, BookingReturnFlight, Booking
from app.models.flight import Flight, Route


class PreloadedData:
    """Container for preloaded data to minimize database queries"""
    def __init__(self):
        self.flights: Dict[int, List[Flight]] = defaultdict(list)  # airport_id -> flights
        self.airports: Dict[int, Airport] = {}
        self.routes: Dict[int, Route] = {}
        self.airline_aircraft: Dict[str, AirlineAircraft] = {}


class EarliestArrival:
    """Container for earliest arrival information at an airport"""
    def __init__(self, time: datetime.datetime, path: List[Flight], cost: float):
        self.time = time
        self.path = path
        self.cost = cost


class SearchFlight:
    def __init__(self):
        self.preloaded_data: Optional[PreloadedData] = None
        self.preloaded_date_range: Optional[Tuple[datetime.datetime, datetime.datetime]] = None
    
    def _is_data_preloaded_for_range(self, date_min: datetime.datetime, date_max: datetime.datetime) -> bool:
        """Check if data is already preloaded for the given date range"""
        if not self.preloaded_data or not self.preloaded_date_range:
            return False
        
        preloaded_min, preloaded_max = self.preloaded_date_range
        return preloaded_min <= date_min and preloaded_max >= date_max
    
    def raptor_search(self, origin_id: int, destination_id: int, departure_date: datetime.date,
                      max_transfers: int, min_transfer_minutes: int, args: dict) -> Dict[int, List[dict]]:
        """
        Optimized RAPTOR search with proper earliest arrival tracking and data preloading.
        Returns a dict mapping k transfers -> list of journey results.
        """
        # Prepare extended date window (support multi-day journeys)
        start_of_day = datetime.datetime.combine(departure_date, datetime.time.min, datetime.timezone.utc)
        date_min = start_of_day
        date_max = datetime.datetime.combine(departure_date + datetime.timedelta(days=2), datetime.time.min, datetime.timezone.utc)

        # Preload all relevant data to minimize DB queries (only if not already preloaded)
        if not self.preloaded_data:
            self._preload_data(date_min, date_max, args)

        # Storage for all itineraries by exact #transfers
        all_by_transfers: Dict[int, List[dict]] = {k: [] for k in range(max_transfers + 1)}

        # RAPTOR's earliest arrival times per round
        earliest_arrival: List[Dict[int, EarliestArrival]] = [
            {} for _ in range(max_transfers + 2)
        ]

        # Initialize round 0 - direct flights from origin
        earliest_arrival[0][origin_id] = EarliestArrival(start_of_day, [], 0.0)

        processed_paths = set()
        marked_stops = set()

        # RAPTOR rounds
        for k in range(1, max_transfers + 2):
            marked_stops.clear()
            
            # Mark stops improved in previous round
            for airport_id, arrival_info in earliest_arrival[k - 1].items():
                if arrival_info:
                    marked_stops.add(airport_id)

            if not marked_stops:
                break  # No improvements possible

            # Process each marked stop
            for current_airport in marked_stops:
                current_state = earliest_arrival[k - 1].get(current_airport)
                if not current_state:
                    continue

                # Get all flights from this airport using preloaded data
                flights = self.preloaded_data.flights.get(current_airport, [])
                
                # Filter flights to only those relevant for this specific date
                relevant_flights = [
                    flight for flight in flights 
                    if flight.departure_time >= date_min and flight.departure_time < date_max
                ]
                
                for flight in relevant_flights:
                    route = self.preloaded_data.routes.get(flight.route_id)
                    if not route:
                        continue

                    # Calculate minimum departure time
                    min_dep_time = current_state.time
                    if current_state.path:
                        min_dep_time = current_state.time + datetime.timedelta(minutes=min_transfer_minutes)

                    # Check if flight is valid
                    if flight.departure_time < min_dep_time or flight.departure_time >= date_max:
                        continue

                    # Apply filters
                    if not self._passes_filters(flight, args):
                        continue

                    dest_airport = route.arrival_airport_id
                    new_path = current_state.path + [flight]
                    new_cost = current_state.cost + flight.price_economy_class

                    # Check if this improves the arrival time at destination
                    existing_arrival = earliest_arrival[k].get(dest_airport)
                    should_update = (
                        not existing_arrival or 
                        flight.arrival_time < existing_arrival.time or
                        (flight.arrival_time == existing_arrival.time and new_cost < existing_arrival.cost)
                    )

                    if should_update:
                        earliest_arrival[k][dest_airport] = EarliestArrival(
                            flight.arrival_time, new_path, new_cost
                        )

                        # If this reaches the destination, record the journey
                        if dest_airport == destination_id and len(new_path) - 1 == k - 1:
                            flight_ids = tuple(f.id for f in new_path)
                            if flight_ids not in processed_paths:
                                processed_paths.add(flight_ids)
                                result = self._format_journey_result(new_path, origin_id, destination_id)
                                if result:
                                    all_by_transfers[k - 1].append(result)

            # Copy non-improved arrivals from previous round
            for airport_id, arrival_info in earliest_arrival[k - 1].items():
                if airport_id not in earliest_arrival[k] and arrival_info:
                    earliest_arrival[k][airport_id] = arrival_info

        return all_by_transfers

    def _preload_data(self, date_min: datetime.datetime, date_max: datetime.datetime, args: dict) -> None:
        """Preload all relevant data to minimize database queries"""
        # Check if data is already preloaded for this range
        if self._is_data_preloaded_for_range(date_min, date_max):
            return
        
        # Store the date range for future checks
        self.preloaded_date_range = (date_min, date_max)
        
        # Build where clause for flights
        where_conditions = [
            Flight.departure_time >= date_min,
            Flight.departure_time < date_max,
            Flight.fully_booked == False,
        ]

        # Apply airline filter to reduce data load
        query = Flight.query.join(Route, Flight.route_id == Route.id)
        
        if args.get('airline_id'):
            try:
                where_conditions.append(Route.airline_id == args['airline_id'])
            except ValueError:
                pass  # Invalid airline_id

        flights = query.filter(*where_conditions).all()

        # Initialize preloaded data
        self.preloaded_data = PreloadedData()

        # Group flights by departure airport
        for flight in flights:
            route = Route.query.get(flight.route_id)
            if route:
                self.preloaded_data.flights[route.departure_airport_id].append(flight)
                self.preloaded_data.routes[flight.route_id] = route

        # Preload airports (batch query)
        airport_ids = set()
        for flight in flights:
            route = self.preloaded_data.routes.get(flight.route_id)
            if route:
                airport_ids.add(route.departure_airport_id)
                airport_ids.add(route.arrival_airport_id)

        airports = Airport.query.filter(Airport.id.in_(list(airport_ids))).all()
        for airport in airports:
            self.preloaded_data.airports[airport.id] = airport

        # Preload aircraft data (batch query)
        aircraft_ids = [f.aircraft_id for f in flights if f.aircraft_id]
        aircraft_data = AirlineAircraft.query.filter(
            AirlineAircraft.id.in_(aircraft_ids)
        ).all()
        for ac in aircraft_data:
            self.preloaded_data.airline_aircraft[str(ac.id)] = ac

    def _passes_filters(self, flight: Flight, args: dict) -> bool:
        """Optimized filter checking using preloaded data"""
        # Price filter
        if args.get('price_max') and flight.price_economy_class > args['price_max']:
            return False

        # Time range filters
        if args.get('departure_time_min'):
            time_str = flight.departure_time.strftime('%H:%M')
            if time_str < args['departure_time_min']:
                return False

        if args.get('departure_time_max'):
            time_str = flight.departure_time.strftime('%H:%M')
            if time_str > args['departure_time_max']:
                return False

        return True

    def _format_journey_result(self, flight_path: List[Flight], origin_id: int, destination_id: int) -> Optional[dict]:
        """Format a journey into the expected result format using preloaded data"""
        if not flight_path or not self.preloaded_data:
            return None

        # Get first and last flight
        first_flight = flight_path[0]
        last_flight = flight_path[-1]

        # Get origin and destination airports from preloaded data
        origin_airport = self.preloaded_data.airports.get(origin_id)
        destination_airport = self.preloaded_data.airports.get(destination_id)

        if not origin_airport or not destination_airport:
            return None

        if not origin_airport.iata_code or not destination_airport.iata_code:
            return None

        # Calculate total duration
        total_duration_minutes = int((last_flight.arrival_time - first_flight.departure_time).total_seconds() / 60)

        # Calculate total prices
        total_economy_price = sum(flight.price_economy_class for flight in flight_path)
        total_business_price = sum(flight.price_business_class for flight in flight_path)
        total_first_price = sum(flight.price_first_class for flight in flight_path)

        # Create segments using preloaded data
        segments = []
        for flight in flight_path:
            route = self.preloaded_data.routes.get(flight.route_id)
            if not route:
                continue

            departure_airport = self.preloaded_data.airports.get(route.departure_airport_id)
            arrival_airport = self.preloaded_data.airports.get(route.arrival_airport_id)

            if not departure_airport or not arrival_airport:
                continue

            segment = self._process_flight_segment(flight, route, departure_airport, arrival_airport)
            if segment:
                segments.append(segment)

        # Create layover information
        layovers = []
        for i in range(len(flight_path) - 1):
            current_flight = flight_path[i]
            next_flight = flight_path[i + 1]
            
            current_route = self.preloaded_data.routes.get(current_flight.route_id)
            if not current_route:
                continue

            airport = self.preloaded_data.airports.get(current_route.arrival_airport_id)
            if not airport or not airport.iata_code:
                continue

            layover_duration = int((next_flight.departure_time - current_flight.arrival_time).total_seconds() / 60)

            layovers.append({
                'airport': airport.iata_code,
                'duration_minutes': layover_duration
            })

        return {
            'departure_airport': origin_airport.iata_code,
            'arrival_airport': destination_airport.iata_code,
            'duration_minutes': total_duration_minutes,
            'price_economy': round(total_economy_price, 2),
            'price_business': round(total_business_price, 2),
            'price_first': round(total_first_price, 2),
            'is_direct': len(flight_path) == 1,
            'stops': len(flight_path) - 1,
            'segments': segments,
            'layovers': layovers
        }

    def _process_flight_segment(self, flight: Flight, route: Route, 
                              departure_airport: Airport, arrival_airport: Airport) -> Optional[dict]:
        """Process flight segment using preloaded data"""
        if not departure_airport.iata_code or not arrival_airport.iata_code:
            return None
        
        aircraft_instance = self.preloaded_data.airline_aircraft.get(str(flight.aircraft_id))
        if not aircraft_instance or not aircraft_instance.aircraft:
            return None

        aircraft = aircraft_instance.aircraft
        airline = Airline.query.get(route.airline_id)

        # Calculate flight duration in minutes
        duration_minutes = int((flight.arrival_time - flight.departure_time).total_seconds() / 60)

        return {
            'id': str(flight.id),
            'flight_number': route.flight_number,
            'airline_name': airline.name if airline else 'Unknown Airline',
            'airline_id': str(airline.id) if airline else '',
            'departure_airport': departure_airport.iata_code,
            'arrival_airport': arrival_airport.iata_code,
            'departure_time': flight.departure_time,
            'arrival_time': flight.arrival_time,
            'duration_minutes': duration_minutes,
            'price_economy': round(flight.price_economy_class, 2),
            'price_business': round(flight.price_business_class, 2),
            'price_first': round(flight.price_first_class, 2),
            'aircraft_name': aircraft.name if aircraft else 'Unknown Aircraft',
            'gate': flight.gate,
            'terminal': flight.terminal
        }

def check_duplicate_flight(journey: dict, args: dict) -> bool:
    """Check if user already has a booking for any segment in the journey"""
    if not args.get('user_id'):
        return False
    
    for segment in journey['segments']:
        # Check if the user has a booking with this flight as departure flight
        booking_departure = BookingDepartureFlight.query.join(Booking).filter(
            BookingDepartureFlight.flight_id == segment['id'],
            Booking.user_id == args['user_id']
        ).first()

        # Check if the user has a booking with this flight as return flight
        booking_return = BookingReturnFlight.query.join(Booking).filter(
            BookingReturnFlight.flight_id == segment['id'],
            Booking.user_id == args['user_id']
        ).first()

        if booking_departure or booking_return:
            return True
    
    return False


def filter_journeys(unfiltered_journeys: List[dict], args: dict) -> List[dict]:
    """Filter journeys based on provided arguments with async-compatible duplicate checking"""
    filtered_journeys = []

    for journey in unfiltered_journeys:
        if journey is None:
            continue
        
        # Remove journeys where user already has a booking for any segment
        if args.get('user_id'):
            user_has_booking = check_duplicate_flight(journey, args)
            if user_has_booking:
                continue

        # Filter by departure time range
        if args.get('departure_time_min'):
            min_time = datetime.datetime.strptime(args['departure_time_min'], '%H:%M').time()
            departure_time = journey['segments'][0]['departure_time']
            if isinstance(departure_time, str):
                departure_time = datetime.datetime.fromisoformat(departure_time.replace('Z', '+00:00'))
            
            if departure_time.time() < min_time:
                continue

        if args.get('departure_time_max'):
            max_time = datetime.datetime.strptime(args['departure_time_max'], '%H:%M').time()
            departure_time = journey['segments'][0]['departure_time']
            if isinstance(departure_time, str):
                departure_time = datetime.datetime.fromisoformat(departure_time.replace('Z', '+00:00'))
            
            if departure_time.time() > max_time:
                continue

        if args.get('price_max'):
            if journey['price_economy'] > args['price_max']:
                continue

        filtered_journeys.append(journey)

    return filtered_journeys


def sort_journeys(unfiltered_journeys: List[dict], args: dict) -> List[dict]:
    """Sort journeys based on provided arguments"""
    journeys = unfiltered_journeys.copy()

    if args.get('order_by') == 'price':
        journeys.sort(key=lambda x: x['price_economy'], reverse=args.get('order_by_desc', False))
    elif args.get('order_by') == 'duration':
        journeys.sort(key=lambda x: x['duration_minutes'], reverse=args.get('order_by_desc', False))
    elif args.get('order_by') == 'stops':
        journeys.sort(key=lambda x: x['stops'], reverse=args.get('order_by_desc', False))

    return journeys


def get_airports(args: dict) -> Tuple[List[Airport], List[Airport], Optional[Tuple[dict, int]]]:
    """Get departure and arrival airports based on search arguments"""
    error = None
    
    # Get departure airports
    if args['departure_type'] == 'airport':
        if not args.get('departure_id'):
            error = ({'error': 'Departure airport ID is required', 'code': 400}, 400)
            return [], [], error
        departure_airports = Airport.query.filter_by(id=args['departure_id']).all()
    else:
        if not args.get('departure_id'):
            error = ({'error': 'Departure city ID is required', 'code': 400}, 400)
            return [], [], error
        departure_airports = Airport.query.filter_by(city_id=args['departure_id']).all()

    # Get arrival airports
    if args['arrival_type'] == 'airport':
        if not args.get('arrival_id'):
            error = ({'error': 'Arrival airport ID is required', 'code': 400}, 400)
            return [], [], error
        arrival_airports = Airport.query.filter_by(id=args['arrival_id']).all()
    else:
        if not args.get('arrival_id'):
            error = ({'error': 'Arrival city ID is required', 'code': 400}, 400)
            return [], [], error
        arrival_airports = Airport.query.filter_by(city_id=args['arrival_id']).all()

    if not departure_airports or not arrival_airports:
        error = ({'error': 'No valid departure or arrival airports found', 'code': 400}, 400)
    
    return departure_airports, arrival_airports, error


def lowest_price_multiple_dates(departure_date_range: List[datetime.date], 
                               departure_airports: List[Airport], 
                               arrival_airports: List[Airport], 
                               args: dict) -> List[Optional[float]]:
    """Get lowest prices for multiple dates using optimized bulk search"""
    if not departure_date_range:
        return []
    
    # Create a single SearchFlight instance for reuse
    search_flight = SearchFlight()
    
    # Prepare extended date window covering all dates in the range
    start_date = min(departure_date_range)
    end_date = max(departure_date_range)
    
    # Extend to next day to ensure we get all flights
    date_min = datetime.datetime.combine(start_date, datetime.time.min, datetime.timezone.utc)
    date_max = datetime.datetime.combine(end_date + datetime.timedelta(days=2), datetime.time.min, datetime.timezone.utc)
    
    # Preload data once for all dates
    search_flight._preload_data(date_min, date_max, args)
    
    departure_journeys = []
    
    # Process each date using preloaded data
    for date in departure_date_range:
        journey_departure = []
        
        for departure_airport in departure_airports:
            for arrival_airport in arrival_airports:
                # Use the same search instance with preloaded data
                departure_results = search_flight.raptor_search(
                    departure_airport.id,
                    arrival_airport.id,
                    date,
                    args.get('max_transfers', 3),
                    120,  # min_transfer_time
                    args
                )
                
                # Collect results from all transfer levels
                for k_step in departure_results:
                    journey_departure.extend(departure_results[k_step])

        # Sort and filter journeys
        journey_departure = sort_journeys(journey_departure, args)
        filtered = filter_journeys(journey_departure, args)

        # Get the best price for each day
        if filtered:
            departure_journeys.append(filtered[0]['price_economy'])
        else:
            departure_journeys.append(None)
    
    return departure_journeys


def generate_journey(departure_airport: Airport, arrival_airport: Airport, 
                    departure_date: datetime.date, max_transfers: int = 3,
                    min_transfer_time: int = 120, args: Optional[dict] = None) -> List[dict]:
    """Generate journeys using the optimized RAPTOR search algorithm"""
    result = []
    
    search_flight = SearchFlight()
    departure_results = search_flight.raptor_search(
        departure_airport.id,
        arrival_airport.id,
        departure_date,
        max_transfers,
        min_transfer_time,
        args or {}
    )

    # Collect results from all transfer levels
    for k_step in departure_results:
        result.extend(departure_results[k_step])

    return result
