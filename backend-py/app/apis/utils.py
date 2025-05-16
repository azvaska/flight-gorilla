from functools import wraps
from typing import Type

from flask import current_app
from flask_jwt_extended import get_jwt_identity

from app.models import Flight
from app.models.common import ClassType


def price_from_flight(flight:Type[Flight] | None,class_type:ClassType):
    flight_price = 0.0
    if class_type == ClassType.FIRST_CLASS:
        flight_price = flight.price_first_class
    elif class_type == ClassType.BUSINESS_CLASS:
        flight_price = flight.price_business_class
    elif class_type == ClassType.ECONOMY_CLASS:
        flight_price = flight.price_economy_class

    return flight_price

def airline_id_from_user():
    """
    A decorator that adds the airline_id from the authenticated user to the kwargs
    passed to the decorated function.

    Requires that the user is authenticated via JWT and has an airline_id associated
    to their account.
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get current user from JWT token
            user_id = get_jwt_identity()
            datastore = current_app.extensions['security'].datastore
            user = datastore.find_user(id=user_id)

            if not user:
                return {'error': 'User not found'}, 404

            if not user.airline_id:
                return {'error': 'User is not associated with an airline'}, 403

            # Add the airline_id to the kwargs
            kwargs['airline_id'] = user.airline_id

            return f(*args, **kwargs)

        return decorated_function

    return decorator