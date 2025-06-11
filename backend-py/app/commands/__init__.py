from .add_airports import init_app as init_airports
from .add_aircraft import init_app as init_aircraft
from .add_airlines import init_app as init_airlines
from .add_users import init_app as init_users
from .add_flight import init_app as init_flight
from .add_nations import init_app as init_nations
from .add_extras import init_app as init_extras
from .add_bookings import init_app as init_bookings

def init_app(app):
    """Register all seed commands with the Flask app."""
    init_airports(app)
    init_aircraft(app)
    init_airlines(app)
    init_users(app)
    init_flight(app)
    init_nations(app)
    init_extras(app)
    init_bookings(app)
