import click
from flask.cli import with_appcontext
from flask import current_app
from app.models import Nation,Airport,City
import csv

@click.command('seed-airports')
@with_appcontext
def seed_airports():
    db_session = current_app.extensions['sqlalchemy'].session

    with open('airports.csv') as csvfile:
        csvreader = csv.DictReader(csvfile, delimiter=',')
        for row in csvreader:
            if 'airport' in row['type'] :
                city_name = row['municipality']
                nation = Nation.query.filter_by(alpha2=row['iso_country']).first()
                iata_code = row['iata_code'] or None
                icao_code = row['icao_code'] or row['ident']
                if len(icao_code) != 4:
                    icao_code = ""
                if city_name == "":
                    city_name = row['name'].split('Airport')[0].strip()
                if city_name and nation:
                    # Avoid duplicates
                    city = City.query.filter_by(name=city_name, nation=nation).first()
                    if city is None:
                        city = City(name=city_name, nation=nation)
                        db_session.add(city)

                    existing_airport = Airport.query.filter_by(iata_code=iata_code).first()
                    if existing_airport:
                        continue

                    airport = Airport(name=row['name'], iata_code=iata_code, icao_code=icao_code,
                                      longitude=row['longitude_deg'],
                                      latitude=row['latitude_deg'], city=city)
                    db_session.add(airport)
                else:
                    click.echo("City or nation not found for airport:", row['name'],nation)
        
    db_session.commit()
    db_session.close()


def init_app(app):
    app.cli.add_command(seed_airports)
