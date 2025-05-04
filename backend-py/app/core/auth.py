from functools import wraps
from flask import jsonify
from flask_login import current_user


def role_required(role_name):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify(message="Authentication required"), 401

            if not current_user.has_role(role_name):
                return jsonify(message="Permission denied"), 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator