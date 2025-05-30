import datetime
import uuid

from app.models import Aircraft
from app.models.airlines import Airline, AirlineAircraft
from app.models.airport import Airport
from app.models.flight import Flight, Route


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
            'price_economy': round(total_economy_price, 2),
            'price_business': round(total_business_price, 2),
            'price_first': round(total_first_price, 2),
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
            'price_economy': round(flight.price_economy_class, 2),
            'price_business': round(flight.price_business_class, 2),
            'price_first': round(flight.price_first_class, 2),
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

        return flight_query


def filter_journeys(unfiltered_journeys, args):
    """Filter journeys based on provided arguments"""
    filtered_journeys = []

    for journey in unfiltered_journeys:
        if journey is None:
            filtered_journeys.append(None)
            continue
        # Filter by departure time range
        if args['departure_time_min']:
            min_time = datetime.datetime.strptime(args['departure_time_min'], '%H:%M').time()

            if journey['segments'][0]['departure_time'].time() < min_time:
                continue

        if args['departure_time_max']:
            max_time = datetime.datetime.strptime(args['departure_time_max'], '%H:%M').time()

            if journey['segments'][0]['departure_time'].time() > max_time:
                continue

        if args['price_max']:
            if journey['price_economy'] > args['price_max']:
                continue

        filtered_journeys.append(journey)

    return filtered_journeys


def sort_journeys(unfiltered_journeys, args):
    """Sort journeys based on provided arguments"""
    if args['order_by'] == 'price':
        unfiltered_journeys.sort(key=lambda x: x['price_economy'], reverse=args['order_by_desc'])
    elif args['order_by'] == 'duration':
        unfiltered_journeys.sort(key=lambda x: x['duration_minutes'], reverse=args['order_by_desc'])
    elif args['order_by'] == 'stops':
        unfiltered_journeys.sort(key=lambda x: x['stops'], reverse=args['order_by_desc'])

    return unfiltered_journeys


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
