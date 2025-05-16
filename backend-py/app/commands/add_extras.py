import random

import click
from flask.cli import with_appcontext
from flask import current_app

from app.models import Airline, Extra
from app.models.aircraft import Aircraft
from app.models.flight import FlightExtra, Flight


@click.command('seed-extras')
@with_appcontext
def seed_extras():
    """Seed database with common aircraft models"""
    db_session = current_app.extensions['sqlalchemy'].session


    # Add new aircraft
    airline = db_session.query(Airline).first()
    flights = db_session.query(Flight).all()
    if not airline:
        click.echo('No airline found in the database.')
        return
    if not flights:
        click.echo('No flight found in the database.')
        return
    click.echo(f'Adding Extras to the database for airline: {airline.name}')
    extras = db_session.query(Extra).all()
    if extras:
        click.echo('Extras already exist in the database.')
        return

    db_session.add(Extra(
        name='Extra Meal',
        description='A delicious extra meal for your flight.',
        airline_id=airline.id
    ))
    db_session.add(Extra(
        name='Extra Monkeu',
        description='A delicious extra Monkey for your flight.',
        airline_id=airline.id,
    required_on_all_segments=True,
        stackable=False
    ))
    db_session.add(Extra(
        name='Additional Baggage ',
        description='More baggage allowance for your flight.',
        airline_id=airline.id,
        required_on_all_segments=True,
        stackable=True
    ))
    db_session.commit()

    extras = db_session.query(Extra).all()
    for extra in extras:
        for flight in flights:
            db_session.add(FlightExtra(
                flight_id=flight.id,
                extra_id=extra.id,
                limit = random.randint(1, 5),
                price=random.randint(10, 100),
            ))

    db_session.commit()
    click.echo(f'Added Extras Flight to the database.')

def init_app(app):
    app.cli.add_command(seed_extras)
