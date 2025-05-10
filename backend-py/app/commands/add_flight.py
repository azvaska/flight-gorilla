import datetime

import click
from flask.cli import with_appcontext
from app.extensions import db
from app.models import Flight, Airport
from app.models.aircraft import Aircraft
from app.models.airlines import Airline, AirlineAircraft
import random
import string

from app.models.flight import Route

# Your existing aircraft_data
aircraft_data = [
    # Wide-body aircraft
    ('Boeing 747-400', 60, 6, ['A1']),
    ('Boeing 777-300ER', 55, 6, []),
    ('Airbus A380-800', 70, 6, ['A1']),
    ('Airbus A350-900', 52, 6, []),
    ('Airbus A330-300', 50, 6, []),
    # Narrow-body aircraft
    ('Boeing 737-800', 32, 6, []),
    ('Boeing 737 MAX 8', 33, 6, []),
    ('Airbus A320neo', 31, 6, []),
    ('Airbus A321LR', 36, 6, []),
]

def generate_seat_layout(rows, columns, unavailable_seats):
    """Generates a list of all possible seats, excluding unavailable ones."""
    all_seats = [f"{row + 1}{chr(ord('A') + col)}" for row in range(rows) for col in range(columns)]
    return [seat for seat in all_seats if seat not in unavailable_seats]

def generate_tail_number():
    """Generates a random tail number."""
    prefix = random.choice(['N', 'G', 'D', 'C', 'B'])
    numbers = ''.join(random.choices(string.digits, k=3))
    suffix = ''.join(random.choices(string.ascii_uppercase, k=2))
    return f"{prefix}{numbers}{suffix}"

@click.command('seed-airline-aircraft')
@with_appcontext
def seed_airline_aircraft():


    airline_id = Airline.query.first().id  # Replace with the actual airline ID you want to use
    """Seeds aircraft and associates them with an airline."""

    airline = db.session.get(Airline, airline_id)

    created_aircraft_objects = [] #Aircraft.query.all()
    # for name, rows, columns, unavailable in aircraft_data:
    #     aircraft = Aircraft.query.filter_by(name=name).first()
    #     if not aircraft:
    #         aircraft = Aircraft(name=name, rows=rows, columns=columns, unavailable_seats=unavailable)
    #         db.session.add(aircraft)
    #         click.echo(f"Created aircraft: {name}")
    #     else:
    #         click.echo(f"Aircraft already exists: {name}")
    #     created_aircraft_objects.append(aircraft)
    # db.session.commit() # Commit aircraft creation first to get IDs

    click.echo(f"\nAssociating aircraft with airline: {airline.name}")
    for aircraft_model in created_aircraft_objects:
        # Check if this specific aircraft model is already associated with the airline
        existing_airline_aircraft = AirlineAircraft.query.filter_by(
            airline_id=airline_id,
            aircraft_id=aircraft_model.id
        ).first()

        if existing_airline_aircraft:
            click.echo(f"Aircraft model {aircraft_model.name} (ID: {aircraft_model.id}) is already associated with airline {airline.name} (Tail: {existing_airline_aircraft.tail_number}). Skipping.")
            continue

        all_available_seats = generate_seat_layout(aircraft_model.rows, aircraft_model.columns, aircraft_model.unavailable_seats)
        random.shuffle(all_available_seats) # Shuffle to randomly assign seats to classes

        # Define proportions for seat classes (customize as needed)
        num_seats = len(all_available_seats)
        first_class_count = int(num_seats * 0.1)  # 10% first class
        business_class_count = int(num_seats * 0.2) # 20% business class
        # Economy gets the rest

        first_class_seats = all_available_seats[:first_class_count]
        business_class_seats = all_available_seats[first_class_count : first_class_count + business_class_count]
        economy_class_seats = all_available_seats[first_class_count + business_class_count:]
        tail_number = generate_tail_number()

        # Ensure tail number is unique for the airline
        while AirlineAircraft.query.filter_by(airline_id=airline_id, tail_number=tail_number).first():
            tail_number = generate_tail_number()


        airline_aircraft_entry = AirlineAircraft(
            aircraft_id=aircraft_model.id,
            airline_id=airline_id,
            first_class_seats=first_class_seats,
            business_class_seats=business_class_seats,
            economy_class_seats=economy_class_seats,
            tail_number=tail_number
        )
        db.session.add(airline_aircraft_entry)
        click.echo(f"Associated aircraft {aircraft_model.name} (ID: {aircraft_model.id}) with airline {airline.name} (Tail: {tail_number})")

    db.session.commit()
    #generate flights for each aircraft
    all_airports = Airport.query.all()

    for airline_aircraft in AirlineAircraft.query.filter_by(airline_id=airline_id).all():
        if len(all_airports) < 2:
            click.echo("Not enough airports in the database to create flights.")
            break

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
        db.session.add(route)
        db.session.commit()
        # Generate random departure time within the next 30 days
        departure_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=random.randint(1, 30),
                                                                                           hours=random.randint(0, 23),
                                                                                           minutes=random.randint(0,
                                                                                                                  59))
        # Generate random flight duration (e.g., 1 to 10 hours)
        flight_duration_hours = random.randint(1, 10)
        flight_duration_minutes = random.randint(0, 59)
        arrival_time = departure_time + datetime.timedelta(hours=flight_duration_hours, minutes=flight_duration_minutes)

        flight_number_suffix = random.randint(100, 999)
        # Attempt to get airline name for flight number, default if not easily accessible
        airline_code = "FL"  # Default prefix
        airline = db.session.get(Airline, airline_id)
        if airline and airline.name:
            airline_code = "".join([word[0] for word in airline.name.split()[:2]]).upper()

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
        db.session.add(flight)
        click.echo(
            f"Created flight {route.flight_number} from {departure_airport.iata_code or departure_airport.name} to {arrival_airport.iata_code or arrival_airport.name}")

    click.echo("Airline aircraft seeding complete.")


# To register this command in your app (e.g., in manage.py or app/__init__.py):
# from app.commands.add_aircraft import seed_airline_aircraft
#
# def register_commands(app):
#     app.cli.add_command(seed_airline_aircraft)
#     # ... other commands