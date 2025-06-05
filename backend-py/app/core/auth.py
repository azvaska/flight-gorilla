from functools import wraps
from flask import jsonify
from flask_login import current_user

from functools import wraps
from flask import current_app
from flask_jwt_extended import get_jwt_identity


def roles_required(allowed_roles_outer,inactive_allowed=False):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check permissions
            allowed_roles = allowed_roles_outer
            user_id = get_jwt_identity()
            datastore = current_app.extensions['security'].datastore
            user = datastore.find_user(id=user_id)
            if not user:
                return {'error': 'User not found.', 'code': 404}, 404
            if not user.active and not inactive_allowed:
                return {'error': 'User is not active.', 'code': 403}, 403
            
            if type(allowed_roles) is not list:
                allowed_roles = [allowed_roles]
            # Check if user has any of the allowed roles
            has_permission = any(user.has_role(role) for role in allowed_roles)
            if not has_permission:
                return {'error': f'Access restricted.', 'code': 403}, 403

            return f(*args, **kwargs)

        return decorated_function

    return decorator