import random
import string
import datetime
import uuid
import click
from flask.cli import with_appcontext
from sqlalchemy import func

from app.extensions import db_session
from app.models import Booking
from app.models.flight import Flight,FlightExtra
from app.models.booking import Booking, BookingDepartureFlight, BookingReturnFlight, BookingFlightExtra
from app.models.user import User
from app.models.airlines import AirlineAircraft
from app.models.common import ClassType
from app.models.extra import Extra


def generate_unique_booking_number():
    """Generate a unique 6-letter booking reference"""
    while True:
        booking_number = "".join(random.choices(string.ascii_uppercase, k=10))
        existing = db_session.query(Booking).filter_by(booking_number=booking_number).first()
        if not existing:
            return booking_number


def get_available_seat(flight: Flight, class_type: ClassType, booked_seats: set) -> str:
    """Get an available seat for the given class type"""
    aircraft = flight.aircraft
    
    if class_type == ClassType.FIRST_CLASS:
        available_seats = [seat for seat in aircraft.first_class_seats
                          if seat not in booked_seats]
    elif class_type == ClassType.BUSINESS_CLASS:
        available_seats = [seat for seat in aircraft.business_class_seats
                          if seat not in booked_seats]
    else:  # ECONOMY_CLASS
        available_seats = [seat for seat in aircraft.economy_class_seats
                          if seat not in booked_seats]
    
    if not available_seats:
        return None
    
    return random.choice(available_seats)


def get_flight_price(flight: Flight, class_type: ClassType) -> float:
    """Get the price for a specific class on a flight"""
    if class_type == ClassType.FIRST_CLASS:
        return flight.price_first_class
    elif class_type == ClassType.BUSINESS_CLASS:
        return flight.price_business_class
    else:  # ECONOMY_CLASS
        return flight.price_economy_class


def create_realistic_booking(user: User, departure_flight: Flight, return_flight: Flight = None, 
                           force_class: ClassType = None) -> Booking | None:
    """Create a realistic booking with proper seat assignments"""
    
    # Track booked seats across both flights
    booked_seats = set(departure_flight.booked_seats)
    if return_flight:
        booked_seats.update(return_flight.booked_seats)
    
    # Determine class type with realistic distribution
    if force_class:
        class_type = force_class
    else:
        class_weights = [85, 12, 3]  # Economy, Business, First percentages
        class_type = random.choices(
            [ClassType.ECONOMY_CLASS, ClassType.BUSINESS_CLASS, ClassType.FIRST_CLASS],
            weights=class_weights
        )[0]
    
    # Check seat availability for departure flight
    departure_seat = get_available_seat(departure_flight, class_type, booked_seats)
    if not departure_seat:
        # Fallback to economy if preferred class is full
        if class_type != ClassType.ECONOMY_CLASS:
            class_type = ClassType.ECONOMY_CLASS
            departure_seat = get_available_seat(departure_flight, class_type, booked_seats)
        if not departure_seat:
            return None  # Flight completely full
    
    booked_seats.add(departure_seat)
    
    # Check return flight seat if exists
    return_seat = None
    if return_flight:
        return_seat = get_available_seat(return_flight, class_type, booked_seats)
        if not return_seat:
            # Try economy class fallback
            if class_type != ClassType.ECONOMY_CLASS:
                return_seat = get_available_seat(return_flight, ClassType.ECONOMY_CLASS, booked_seats)
            if not return_seat:
                return None  # Return flight full
        booked_seats.add(return_seat)
    
    # Create booking
    booking = Booking(
        id=uuid.uuid4(),
        user_id=user.id,
        booking_number=generate_unique_booking_number(),
    )
    
    total_price = 0.0
    
    # Create departure flight booking
    departure_price = get_flight_price(departure_flight, class_type)
    # Add some price variation (±5%) to simulate dynamic pricing
    departure_price *= random.uniform(0.95, 1.05)
    total_price += departure_price
    
    departure_booking = BookingDepartureFlight(
        booking_id=booking.id,
        flight_id=departure_flight.id,
        seat_number=departure_seat,
        class_type=class_type,
        price=departure_price
    )
    
    # Create return flight booking if exists
    return_booking = None
    if return_flight:
        return_price = get_flight_price(return_flight, class_type)
        return_price *= random.uniform(0.95, 1.05)
        total_price += return_price
        
        return_booking = BookingReturnFlight(
            booking_id=booking.id,
            flight_id=return_flight.id,
            seat_number=return_seat,
            class_type=class_type,
            price=return_price
        )
    
    # Add insurance (30% chance)
    if random.random() < 0.3:
        insurance_price = departure_flight.price_insurance
        if return_flight:
            insurance_price += return_flight.price_insurance
        total_price += insurance_price
    
    # Add extras (40% chance for at least one extra)
    extras_to_add = []
    if random.random() < 0.4:
        # Get available extras for the flights
        departure_extras = FlightExtra.query.filter_by(flight_id=departure_flight.id).all()
        if departure_extras:
            num_extras = random.choices([1, 2, 3], weights=[70, 25, 5])[0]  # Most people get 1 extra
            selected_extras = random.sample(departure_extras, min(num_extras, len(departure_extras)))
            
            for flight_extra in selected_extras:
                quantity = random.randint(1, min(flight_extra.limit, 3))
                extra_total_price = flight_extra.price * quantity
                total_price += extra_total_price
                
                # Create booking extra for departure flight
                booking_extra = BookingFlightExtra(
                    booking_id=booking.id,
                    flight_id=departure_flight.id,
                    extra_id=flight_extra.id,
                    quantity=quantity,
                    extra_price=flight_extra.price,
                )
                extras_to_add.append(booking_extra)
                
                # Add same extra to return flight if exists and available
                if return_flight:
                    return_extra = FlightExtra.query.filter_by(
                        flight_id=return_flight.id, 
                        extra_id=flight_extra.extra_id
                    ).first()
                    if return_extra:
                        return_extra_total = return_extra.price * quantity
                        total_price += return_extra_total
                        
                        return_booking_extra = BookingFlightExtra(
                            booking_id=booking.id,
                            flight_id=return_flight.id,
                            extra_id=return_extra.id,
                            quantity=quantity,
                            extra_price=return_extra.price,
                        )
                        extras_to_add.append(return_booking_extra)

    # Add to session
    db_session.add(booking)
    db_session.add(departure_booking)
    if return_booking:
        db_session.add(return_booking)
    for extra in extras_to_add:
        db_session.add(extra)
    
    return booking


class BookingGenerator:
    def __init__(self):
        self.created_bookings = 0
        self.failed_bookings = 0
        
    def generate_single_trip_bookings(self, num_bookings: int = 50):
        """Generate single-trip (one-way) bookings"""
        click.echo(f"Generating {num_bookings} single-trip bookings...")
        
        # Get users and available flights
        users = User.query.filter_by(name='tesst').all()
        if not users:
            click.echo("No customer users found. Cannot create bookings.")
            return
        
        # Get flights that are not fully booked and in the future
        available_flights = (Flight.query
                           .filter(Flight.fully_booked == False)
                           .filter(Flight.departure_time > datetime.datetime.now(datetime.timezone.utc))
                           .order_by(Flight.departure_time)
                           .all())
        
        if not available_flights:
            click.echo("No available flights found. Cannot create bookings.")
            return
        
        created = 0
        for _ in range(num_bookings):
            user = random.choice(users)
            flight = random.choice(available_flights)
            
            booking = create_realistic_booking(user, flight)
            if booking:
                created += 1
                if created % 10 == 0:
                    click.echo(f"Created {created} single-trip bookings...")
            else:
                self.failed_bookings += 1
        
        self.created_bookings += created
        click.echo(f"✅ Created {created} single-trip bookings")
    
    def generate_round_trip_bookings(self, num_bookings: int = 30):
        """Generate round-trip bookings"""
        click.echo(f"Generating {num_bookings} round-trip bookings...")
        
        users = User.query.filter_by(name='tesst').all()
        if not users:
            return
        
        # Get flight pairs for round trips
        # Find flights that could form logical round trips
        available_flights = (Flight.query
                           .filter(Flight.fully_booked == False)
                           .filter(Flight.departure_time > datetime.datetime.now(datetime.timezone.utc))
                           .all())
        
        created = 0
        attempts = 0
        max_attempts = num_bookings * 400  # Try harder to find round trips
        
        while created < num_bookings and attempts < max_attempts:
            attempts += 1
            user = random.choice(users)
            
            # Pick a random departure flight
            departure_flight = random.choice(available_flights)
            
            # Find potential return flights (same route in reverse, departing later)
            potential_returns = [
                f for f in available_flights
                if (f.route.departure_airport_id == departure_flight.route.arrival_airport_id and
                    f.route.arrival_airport_id == departure_flight.route.departure_airport_id and
                    f.departure_time > departure_flight.arrival_time + datetime.timedelta(hours=4) and
                    f.departure_time < departure_flight.departure_time + datetime.timedelta(days=14))
            ]
            
            if potential_returns:
                return_flight = random.choice(potential_returns)
                booking = create_realistic_booking(user, departure_flight, return_flight)
                if booking:
                    created += 1
                    if created % 5 == 0:
                        click.echo(f"Created {created} round-trip bookings...")
                else:
                    self.failed_bookings += 1
        
        self.created_bookings += created
        click.echo(f"✅ Created {created} round-trip bookings")
    
    def generate_business_bookings(self, num_bookings: int = 15):
        """Generate business class bookings with higher probability of extras"""
        click.echo(f"Generating {num_bookings} business bookings...")
        
        users = User.query.filter_by(name='tesst').all()
        available_flights = (Flight.query
                           .filter(Flight.fully_booked == False)
                           .filter(Flight.departure_time > datetime.datetime.now(datetime.timezone.utc))
                           .all())
        
        if not users or not available_flights:
            return
        
        created = 0
        for _ in range(num_bookings):
            user = random.choice(users)
            
            # Business travelers more likely to book round trips
            if random.random() < 0.7:  # 70% chance of round trip
                departure_flight = random.choice(available_flights)
                potential_returns = [
                    f for f in available_flights
                    if (f.route.departure_airport_id == departure_flight.route.arrival_airport_id and
                        f.route.arrival_airport_id == departure_flight.route.departure_airport_id and
                        f.departure_time > departure_flight.arrival_time + datetime.timedelta(hours=4) and
                        f.departure_time < departure_flight.departure_time + datetime.timedelta(days=7))
                ]
                
                return_flight = random.choice(potential_returns) if potential_returns else None
                
                # Force business or first class
                force_class = random.choice([ClassType.BUSINESS_CLASS, ClassType.FIRST_CLASS])
                booking = create_realistic_booking(user, departure_flight, return_flight, force_class)
            else:
                departure_flight = random.choice(available_flights)
                force_class = random.choice([ClassType.BUSINESS_CLASS, ClassType.FIRST_CLASS])
                booking = create_realistic_booking(user, departure_flight, force_class=force_class)
            
            if booking:
                created += 1
            else:
                self.failed_bookings += 1
        
        self.created_bookings += created
        click.echo(f"✅ Created {created} business bookings")
    


@click.command('seed-bookings')
@click.option('--single-trips', default=250, help='Number of single-trip bookings (default: 50)')
@click.option('--round-trips', default=200, help='Number of round-trip bookings (default: 30)')
@click.option('--business-bookings', default=15, help='Number of business class bookings (default: 15)')
@click.option('--clear-existing', is_flag=True, help='Clear existing bookings before generating new ones')
@with_appcontext
def generate_bookings(single_trips, round_trips, business_bookings, clear_existing):
    """Generate realistic booking data for existing flights"""
    
    click.echo("🎫 Starting booking generation...")
    
    if clear_existing:
        click.echo("🗑️ Clearing existing bookings...")
        db_session.query(BookingFlightExtra).delete()
        db_session.query(BookingDepartureFlight).delete()
        db_session.query(BookingReturnFlight).delete()
        db_session.query(Booking).delete()
        db_session.commit()
        click.echo("✅ Existing bookings cleared")
    
    # Check prerequisites
    flight_count = db_session.query(func.count(Flight.id)).scalar()
    user_count = db_session.query(func.count(User.id)).scalar()
    
    if flight_count == 0:
        click.echo("❌ No flights found. Please run 'flask seed-flights' first.")
        return
    
    if user_count == 0:
        click.echo("❌ No customer users found. Please run 'flask seed-users' first.")
        return
    
    click.echo(f"📊 Found {flight_count} flights and {user_count} customer users")
    
    generator = BookingGenerator()
    
    try:
        # Generate different types of bookings
        generator.generate_single_trip_bookings(single_trips)
        generator.generate_round_trip_bookings(round_trips)
        generator.generate_business_bookings(business_bookings)
        
        # Update flight capacity flags
        click.echo("🔄 Updating flight capacity flags...")
        flights_to_update = db_session.query(Flight).all()
        for flight in flights_to_update:
            booked_count = len(flight.booked_seats)
            total_seats = (len(flight.aircraft.first_class_seats) + 
                          len(flight.aircraft.business_class_seats) + 
                          len(flight.aircraft.economy_class_seats))
            
            flight.fully_booked = booked_count >= total_seats
        
        db_session.commit()
        
        # Summary
        click.echo(f"\n🎉 Booking generation complete!")
        click.echo(f"📊 Summary:")
        click.echo(f"   ✅ Total bookings created: {generator.created_bookings}")
        click.echo(f"   ❌ Failed attempts: {generator.failed_bookings}")
        click.echo(f"   🎯 Success rate: {generator.created_bookings/(generator.created_bookings + generator.failed_bookings)*100:.1f}%")
        
        # Additional statistics
        total_bookings = db_session.query(func.count(Booking.id)).scalar()

        click.echo(f"\n📈 Database statistics:")
        click.echo(f"   📋 Total bookings in database: {total_bookings}")

    except Exception as e:
        db_session.rollback()
        click.echo(f"❌ Error generating bookings: {e}")
        raise
    finally:
        db_session.close()


def init_app(app):
    app.cli.add_command(generate_bookings)