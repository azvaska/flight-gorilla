import datetime
import click
from flask.cli import with_appcontext
from app.extensions import db_session
from app.models import Flight, Airport
from app.models.airlines import Airline, AirlineAircraft
import random
from app.models.flight import Route

@click.command('seed-flights')
@with_appcontext
def seed_flights():

    # Get first airline
    airline_id = Airline.query.first().id
    airline = db_session.get(Airline, airline_id)
    
    # Generate flights for each aircraft
    all_airports = Airport.query.all()

    for airline_aircraft in AirlineAircraft.query.filter_by(airline_id=airline_id).all():
        if len(all_airports) < 2:
            click.echo("Not enough airports in the database to create flights.")
            return

        # Randomly generate a route
        departure_airport = random.choice(all_airports)
        arrival_airport = random.choice(all_airports)
        while arrival_airport.id == departure_airport.id:  # Ensure different airports
            arrival_airport = random.choice(all_airports)

        route = Route(
            departure_airport_id=random.choice(all_airports).id,
            arrival_airport_id=random.choice(all_airports).id,
            airline_id=airline_id,
            flight_number=f"{airline_aircraft.tail_number}{random.randint(100, 999)}",
            period_start=datetime.datetime.now(datetime.timezone.utc),
            period_end=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=random.randint(1, 30))
        )
        db_session.add(route)
        db_session.flush()

        # Generate random departure time within the next 30 days
        departure_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=random.randint(1, 30),
                                                                                           hours=random.randint(0, 23),
                                                                                           minutes=random.randint(0,
                                                                                                                  59))
        # Generate random flight duration (e.g., 1 to 10 hours)
        flight_duration_hours = random.randint(1, 10)
        flight_duration_minutes = random.randint(0, 59)
        arrival_time = departure_time + datetime.timedelta(hours=flight_duration_hours, minutes=flight_duration_minutes)

        flight = Flight(
            route_id=route.id,
            aircraft_id=airline_aircraft.id,
            departure_time=departure_time,
            arrival_time=arrival_time,
            checkin_start_time = departure_time - datetime.timedelta(hours=2),
            checkin_end_time = departure_time - datetime.timedelta(minutes=30),
            boarding_start_time = departure_time - datetime.timedelta(minutes=30),
            boarding_end_time = departure_time - datetime.timedelta(minutes=30),
            price_economy_class=round(random.uniform(100.0, 500.0), 2),
            price_business_class=round(random.uniform(500.0, 1500.0), 2),
            price_first_class=round(random.uniform(1500.0, 3000.0), 2),
            price_insurance=round(random.uniform(20.0, 100.0), 2),
        )
        db_session.add(flight)
        click.echo(
            f"Created flight {route.flight_number} from {departure_airport.iata_code or departure_airport.name} to {arrival_airport.iata_code or arrival_airport.name}")


    # Get random airline aircraft
    airline_aircraft = AirlineAircraft.query.filter_by(airline_id=airline_id).order_by(AirlineAircraft.id.desc()).first()

    # Generate additional mock route with basic ids for better testing
    route = Route(
        departure_airport_id=1,
        arrival_airport_id=2,
        airline_id=airline_id,
        flight_number="123",
        period_start=datetime.datetime.now(datetime.timezone.utc),
        period_end=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=random.randint(1, 30))
    )
    db_session.add(route)
    db_session.flush()

    # Mock departure time of 1 Jan 2026 at 12:00
    departure_time = datetime.datetime(2026, 1, 1, 12, 0, 0, 0, datetime.timezone.utc)
    arrival_time = departure_time + datetime.timedelta(hours=1, minutes=30)

    flight = Flight(
        route_id=route.id,
        aircraft_id=airline_aircraft.id,
        departure_time=departure_time,
        arrival_time=arrival_time,
        checkin_start_time = departure_time - datetime.timedelta(hours=2),
        checkin_end_time = departure_time - datetime.timedelta(minutes=30),
        boarding_start_time = departure_time - datetime.timedelta(minutes=30),
        boarding_end_time = departure_time - datetime.timedelta(minutes=30),
        price_economy_class=round(random.uniform(100.0, 500.0), 2),
        price_business_class=round(random.uniform(500.0, 1500.0), 2),
        price_first_class=round(random.uniform(1500.0, 3000.0), 2),
        price_insurance=round(random.uniform(20.0, 100.0), 2),
    )
    db_session.add(flight)

    db_session.commit()
    db_session.close()
    click.echo("Airline aircraft seeding complete.")

# Register the command with the Flask app
def init_app(app):
    app.cli.add_command(seed_flights)
