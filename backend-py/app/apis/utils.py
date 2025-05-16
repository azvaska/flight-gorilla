from functools import wraps
from typing import Type

from flask import current_app
from flask_jwt_extended import get_jwt_identity

from app.models import Flight
from app.models.common import ClassType
import secrets
import string

def price_from_flight(flight:Type[Flight] | None,class_type:ClassType):
    flight_price = 0.0
    if class_type == ClassType.FIRST_CLASS:
        flight_price = flight.price_first_class
    elif class_type == ClassType.BUSINESS_CLASS:
        flight_price = flight.price_business_class
    elif class_type == ClassType.ECONOMY_CLASS:
        flight_price = flight.price_economy_class

    return flight_price

def generate_secure_password( length=12):
    """Generate a secure random password"""


    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = "!@$*"

    # Ensure password has at least one of each character type
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special_chars)
    ]

    # Fill remaining characters
    remaining_length = length - len(password)
    all_chars = lowercase + uppercase + digits + special_chars
    password.extend(secrets.choice(all_chars) for _ in range(remaining_length))

    # Shuffle the password characters
    secrets.SystemRandom().shuffle(password)

    # Convert list to string
    return ''.join(password)
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