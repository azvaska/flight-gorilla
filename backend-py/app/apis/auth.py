import secrets
import string

from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required, set_access_cookies, set_refresh_cookies, unset_jwt_cookies, unset_refresh_cookies
from flask_restx import Namespace, Resource, fields, marshal
from flask import request,current_app, make_response
from flask_security import hash_password
from sqlalchemy.exc import IntegrityError

from app.apis.utils import generate_secure_password
from app.core.auth import roles_required
from app.models.airlines import Airline
from app.models.user import User
from flask_login import login_user

from app.schemas.airline import  airline_schema
from app.schemas.user import user_schema

# API namespace for authentication operations - no security required at this level
api = Namespace('auth', description='Login related operations',security=None)

# Input model for login requests - requires email and password
login_model_input  = api.model('Login', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password'),
})

user_login_model = api.model('UserLoginModel', {
    'id': fields.String(required=True, description='User ID'),
    'active': fields.Boolean(required=True, description='User active status'),
    'type': fields.String(required=True, description='User type (airline or user)',enum=['airline','user']),
})

login_model_output = api.model('LoginOutput', {
    'access_token': fields.String(required=True, description='Access Token'),
    'user': fields.Nested(user_login_model, required=True, description='User')
})

register_model = api.model('Register', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password'),
    'name': fields.String(required=True, description='First name'),
    'surname': fields.String(required=True, description='Last name'),
    'address': fields.String(description='Address'),
    'zip': fields.String(description='ZIP/postal code'),
    'nation_id': fields.Integer(description='Nation ID'),
})




 
airline_register_model = api.model('AirlineRegister', {
    'email': fields.String(required=True, description='Login Email'),
    'name': fields.String(required=True, description='First name'),
    'surname': fields.String(required=True, description='Last name'),
    'airline_name': fields.String(required=True, description='Airline name'),
    
})

# Generates JWT tokens and sets refresh token as HTTP-only cookie for security
def generate_token(user):
    token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    # Create the JSON data
    data = marshal({
        "access_token": token,
        "user": {
            "id": str(user.id),
            "active": user.active,
            "type": user.roles[0].name
        }
    }, login_model_output)

    # Create response with the data
    response = make_response(data, 200)
    
    # Set only the refresh token as HTTP-only cookie for enhanced security
    set_refresh_cookies(response, refresh_token)

    return response

@api.route('/login')
class LoginResource(Resource):
    @api.expect(login_model_input)
    @api.response(200, 'OK', login_model_output)
    @api.response(401, 'Unauthorized')
    @api.response(403, 'Forbidden')
    @api.response(500, 'Internal Server Error')
    @api.doc(security=None)
    def post(self):
        """Handles user login with email/password authentication"""
        data = request.get_json(force=True)
        email = data.get("email")
        password = data.get("password")
        try:
            datastore = current_app.extensions['security'].datastore
            user = datastore.find_user(email=email)
            if not user:
                return {"error": "Invalid credentials"}, 401

            # Verify password and update if needed (e.g., if using a new hashing algorithm)
            verified = user.verify_and_update_password(password)
            if not verified:
                return {"error": "Invalid credentials"}, 401
            
            # Check if user is active and not an airline user
            if not user.active and user.airline_id is None:
                return {"error": "User is not active"}, 403

            login_user(user)
            return generate_token(user)
        except Exception as e:
            current_app.logger.error(f"Login error: {str(e)}")
            return {"error": 'Login Error'}, 500

@api.route('/refresh')
class RefreshTokenResource(Resource):
    @jwt_required(refresh=True)  # This validates the refresh token
    @api.doc(security='jwt')
    @api.response(200, 'OK', login_model_output)
    @api.response(404, 'Not found')
    @api.response(403, 'Forbidden')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Refresh the access token"""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return {'error': 'User not found'}, 404
            
            if not current_user.active and current_user.airline_id is None:
                return {'error': 'User is not active'}, 403

            return generate_token(current_user)
            
        except Exception as e:
            return {'error': str(e)}, 500

@api.route('/logout')
class LogoutResource(Resource):
    @api.doc(security=None)
    @api.response(200, 'OK')
    def post(self):
        """Logout and clear refresh token cookie"""
        data = {'message': 'Successfully logged out'}
        response = make_response(data, 200)
        unset_refresh_cookies(response)
        return response

@api.route('/register')
class Register(Resource):
    @api.expect(register_model)
    @api.doc(security=None)
    @api.response(200, 'OK', login_model_output)
    @api.response(400, 'Bad Request')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Registers a new regular user with the provided details"""
        data = request.json
        try:
            security = current_app.extensions['security']
            passwrd = data.get('password')
            del data['password']  # Remove password from data before schema validation
            _ = user_schema.load(data, partial=True)
            user = security.datastore.create_user(
                email=data.get('email'),
                password=hash_password(passwrd),
                roles=["user"],
                name=data.get('name'),
                surname=data.get('surname'),
                address=data.get('address'),
                zip=data.get('zip'),
                nation_id=data.get('nation_id'),
                active=True  # Regular users are active by default
                                                  )

            security.datastore.db.session.add(user)
            security.datastore.db.session.commit()

            return generate_token(user)
        except ValueError as e:
            current_app.extensions['security'].datastore.db.session.rollback()
            return {'error': str(e)}, 400
        except IntegrityError as e:
            current_app.extensions['security'].datastore.db.session.rollback()
            # Handle unique constraint violations (e.g., duplicate email)
            if 'unique' in str(e).lower():
                return {'error': 'User already exists'}, 400
            else:
                return {'error': 'Database integrity error'}, 400

        except Exception as e:
            return {'error': str(e)}, 500


credentials_model = api.model('Credentials', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password'),
})

register_airline_model_output = api.model('RegisterAirlineModelOutput', {
    'message': fields.String(required=True, description='Message'),
    'credentials': fields.Nested(credentials_model, required=True, description='Login credentials')
})



@api.route('/register_airline')
class AirlineRegister(Resource):
    @jwt_required()
    @api.expect(airline_register_model)
    @roles_required('admin')  # Only admin users can register new airlines
    @api.response(201, 'Created', register_airline_model_output)
    @api.response(400, 'Bad Request')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Registers a new airline and creates an airline admin user with temporary password"""
        data = request.json

        db = current_app.extensions['security'].datastore.db.session
        try:
            # Create the airline entity first
            airline = Airline(
                name=data['airline_name'],
            )
            db.add(airline)
            db.flush()
            
            # Generate a secure temporary password for the airline admin
            tmp_passwd = generate_secure_password()
            print(f"Generated temporary password: {tmp_passwd}")

            # Create the airline admin user with the temporary password
            security = current_app.extensions['security']
            user = security.datastore.create_user(
                email=data['email'],
                password=hash_password(tmp_passwd),
                roles=["airline-admin"],
                name=data['name'],
                surname=data['surname'],
                airline_id=airline.id,
                active=False  # Airline users need admin approval to become active
            )

            db.add(user)
            db.commit()

            # Return the temporary credentials to the admin
            return {'message': 'Airline registered successfully','credentials':{
                'email': user.email,
                'password': tmp_passwd,
            }}, 201
        except IntegrityError as e:
            db.rollback()
            # Handle unique constraint violations
            if 'unique' in str(e).lower():
                return {'error': 'User or Airline already exists'}, 400
            else:
                return {'error': 'Database integrity error'}, 400
                
        except Exception as e:
            db.rollback()
            import traceback
            traceback.print_exc()
            current_app.logger.error(f"Error during airline registration: {str(e)}")
            return {'error': 'Error during airline registration'}, 500
        