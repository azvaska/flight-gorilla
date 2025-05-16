import random
import string
import click
from flask.cli import with_appcontext
from app.extensions import db_session
from app.models.aircraft import Aircraft
from app.models.airlines import Airline, AirlineAircraft, AirlineAircraftSeat
from app.models.common import ClassType


@click.command('seed-airlines')
@with_appcontext
def seed_airlines():
    """Seed the database with the default airline."""
    # Define default airline details
    airline_name = "Sky High Airlines"

    # Check if airline already exists
    existing = db_session.query(Airline).filter_by(name=airline_name).first()
    if existing:
        click.echo(f"Airline '{airline_name}' already exists, skipping.")
        return

    # Create new airline
    airline = Airline(
        name=f"{airline_name}",
        address="123 Aviation Blvd, New York, NY",
        zip="10001",
        nation_id=1,  # Assuming a valid nation ID exists in the database
        email="contact@skyhighairlines.com",
        website="https://www.skyhighairlines.com",
        is_approved=True,
        first_class_description="Luxurious seating with gourmet meals and premium services.",
        business_class_description="Comfortable seating with excellent meals and services.",
        economy_class_description="Affordable seating with basic amenities for a comfortable journey."
    )
    db_session.add(airline)
    db_session.commit()
    db_session.close()
    click.echo(f"Created airline '{airline_name}'.")


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


@click.command('seed-airline-aircrafts')
@with_appcontext
def seed_airline_aircrafts():
    """Seed the database with the default airline aircraft."""


    # Get first airline
    airline_id = Airline.query.first().id
    airline = db_session.get(Airline, airline_id)

    # Retrieve all aircraft models to associate with the airline
    created_aircraft_objects = db_session.query(Aircraft).all()

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

        # Generate all available seats in order (row by row)
        all_available_seats = generate_seat_layout(aircraft_model.rows, aircraft_model.columns,
                                                   aircraft_model.unavailable_seats)
        all_available_seats  = [seat for seat in all_available_seats if seat not in aircraft_model.unavailable_seats]

        # No random shuffling, to keep seats ordered by row

        # Define proportions for seat classes based on rows
        total_rows = aircraft_model.rows
        first_class_rows = max(1, int(total_rows * 0.1))  # 10% of rows for first class (at least 1 row)
        business_class_rows = max(1, int(total_rows * 0.2))  # 20% of rows for business class (at least 1 row)
        # Economy gets the rest of the rows

        # Calculate seat indices for each class
        first_class_end = first_class_rows * aircraft_model.columns
        business_class_end = first_class_end + (business_class_rows * aircraft_model.columns)

        # Get seats for each class in order
        first_class_seats = [seat for seat in all_available_seats if int(seat[:-1]) <= first_class_rows]
        business_class_seats = [seat for seat in all_available_seats if
                                first_class_rows < int(seat[:-1]) <= (first_class_rows + business_class_rows)]
        economy_class_seats = [seat for seat in all_available_seats if
                               int(seat[:-1]) > (first_class_rows + business_class_rows)]

        tail_number = generate_tail_number()

        # Ensure tail number is unique for the airline
        while AirlineAircraft.query.filter_by(airline_id=airline_id, tail_number=tail_number).first():
            tail_number = generate_tail_number()



        airline_aircraft_entry = AirlineAircraft(
            aircraft_id=aircraft_model.id,
            airline_id=airline_id,
            tail_number=tail_number
        )
        db_session.add(airline_aircraft_entry)
        db_session.commit()

        for seat_number in first_class_seats:
            db_session.add(AirlineAircraftSeat(
                airline_aircraft_id=airline_aircraft_entry.id,
                seat_number=seat_number,
                class_type=ClassType.FIRST_CLASS
            ))

        for seat_number in business_class_seats:
            db_session.add(AirlineAircraftSeat(
                airline_aircraft_id=airline_aircraft_entry.id,
                seat_number=seat_number,
                class_type=ClassType.BUSINESS_CLASS
            ))
        for seat_number in economy_class_seats:
            db_session.add(AirlineAircraftSeat(
                airline_aircraft_id=airline_aircraft_entry.id,
                seat_number=seat_number,
                class_type=ClassType.ECONOMY_CLASS))
        db_session.commit()

        db_session.add(airline_aircraft_entry)
        click.echo(f"Associated aircraft {aircraft_model.name} (ID: {aircraft_model.id}) with airline {airline.name} (Tail: {tail_number})")

    db_session.commit()
    db_session.close()

def init_app(app):
    app.cli.add_command(seed_airlines) 
    app.cli.add_command(seed_airline_aircrafts)
