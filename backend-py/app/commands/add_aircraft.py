import click
from flask.cli import with_appcontext
from flask import current_app

from app.models.aircraft import Aircraft

@click.command('seed-aircraft')
@with_appcontext
def seed_aircraft():
    """Seed database with common aircraft models"""
    db_session = current_app.extensions['sqlalchemy'].session

    # List of common aircraft with their configurations
    # Format: (name, rows, columns, unavailable_seats)
    aircraft_data = [
        # Wide-body aircraft
        ('Boeing 747-400', 60, 6, ['A1']),  # Jumbo jet with 10-across seating
        ('Boeing 777-300ER', 55, 6, []),  # Long-range wide-body
        ('Airbus A380-800', 70, 6, ['A1', ]),  # Double-deck super jumbo
        ('Airbus A350-900', 52, 6, []),  # Latest generation wide-body
        ('Airbus A330-300', 50, 6, []),  # Common medium to long-range wide-body

        # Narrow-body aircraft
        ('Boeing 737-800', 32, 6, []),  # Popular short to medium range
        ('Boeing 737 MAX 8', 33, 6, []),  # New generation 737
        ('Airbus A320neo', 31, 6, []),  # New engine option A320
        ('Airbus A321LR', 36, 6, []),  # Long range variant of A321
    ]

    # Add new aircraft
    added_count = 0
    for name, rows, columns, unavailable_seats in aircraft_data:
        # Check if aircraft already exists
        if db_session.query(Aircraft).filter_by(name=name).first():
            click.echo(f'Aircraft {name} already exists, skipping...')
            continue

        aircraft = Aircraft(
            name=name,
            rows=rows,
            columns=columns,
            unavailable_seats=unavailable_seats
        )
        db_session.add(aircraft)
        added_count += 1

    db_session.commit()
    click.echo(f'Added {added_count} aircraft models to the database.')

def init_app(app):
    app.cli.add_command(seed_aircraft)
