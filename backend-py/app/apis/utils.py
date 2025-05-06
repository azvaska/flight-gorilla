from functools import wraps
from flask import current_app
from flask_jwt_extended import get_jwt_identity


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
                return {'error': 'User not found', 'code': 404}, 404

            if not user.airline_id:
                return {'error': 'User is not associated with an airline', 'code': 403}, 403

            # Add the airline_id to the kwargs
            kwargs['airline_id'] = user.airline_id

            return f(*args, **kwargs)

        return decorated_function

    return decorator