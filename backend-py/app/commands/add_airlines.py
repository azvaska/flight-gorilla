import click
from flask.cli import with_appcontext
from flask import current_app
from app.extensions import db_session
from app.models.airlines import Airline

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
        name=airline_name,
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
    click.echo(f"Created airline '{airline_name}'.")

def init_app(app):
    app.cli.add_command(seed_airlines) 
