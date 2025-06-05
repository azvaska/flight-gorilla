import secrets
import string

from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields, marshal
from flask import request,current_app
from flask_security import hash_password
from sqlalchemy.exc import IntegrityError

from app.apis.utils import generate_secure_password
from app.models.airlines import Airline
from app.models.user import User
from flask_login import login_user

from app.schemas.airline import  airline_schema
from app.schemas.user import user_schema

api = Namespace('auth', description='Login related operations',security=None)

login_model_input  = api.model('Login', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password'),
})

user_model = api.model('User', {
    'id': fields.String(required=True, description='User ID'),
    'active': fields.Boolean(required=True, description='User active status'),
    'type': fields.String(required=True, description='User type (airline or user)',enum=['airline','user']),
})

login_model_output = api.model('LoginOutput', {
    'access_token': fields.String(required=True, description='Access Token'),
    'refresh_token': fields.String(required=True, description='Refresh Token'),
    'user': fields.Nested(user_model, required=True, description='User')
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


airline_user_model = api.model('AirlineUser', {
    'email': fields.String(required=True, description='Login Email'),
    'name': fields.String(required=True, description='First name'),
    'surname': fields.String(required=True, description='Last name'),
    'address': fields.String(description='Address'),
    'zip': fields.String(description='ZIP/postal code'),
    'nation_id': fields.Integer(description='Nation ID'),
})



airline_register_model = api.model('AirlineRegister', {
    'email': fields.String(required=True, description='Info Email Airline'),
    'user_info': fields.Nested(airline_user_model, required=True, description='User information'),
    'name': fields.String(required=True, description='Name of the airline'),
    'website': fields.String(required=True, description='Website of the airline'),
    'address': fields.String(description='Address'),
    'zip': fields.String(description='ZIP/postal code'),
    'nation_id': fields.Integer(description='Nation ID'),
    'first_class_description': fields.String(required=True, description='First class description'),
    'business_class_description': fields.String(required=True, description='Business class description'),
    'economy_class_description': fields.String(required=True, description='Economy class description'),
})

def generate_token(user):
    token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return marshal({
        "access_token": token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "active": user.active,
            "type": "airline" if user.airline_id is None else "user",
        }
    }, login_model_output), 200

@api.route('/login')
class LoginResource(Resource):
    @api.expect(login_model_input)
    @api.response(200, 'OK', login_model_output)
    @api.response(401, 'Unauthorized')
    @api.response(403, 'Forbidden')
    @api.response(500, 'Internal Server Error')
    @api.doc(security=None)
    def post(self):
        data = request.get_json(force=True)
        email = data.get("email")
        password = data.get("password")
        try:
            datastore = current_app.extensions['security'].datastore
            user = datastore.find_user(email=email)
            if not user:
                return {"error": "Invalid credentials"}, 401

            verified = user.verify_and_update_password(password)
            if not verified:
                return {"error": "Invalid credentials"}, 401
            
            if user.airline_id is not None:
                airline = Airline.query.filter_by(id=user.airline_id).first_or_404()
                if not airline.is_approved:
                    return {"error": "Airline is not approved"}, 403

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


# TODO: Implement full registration: name, surname etc
@api.route('/register')
class Register(Resource):
    @api.expect(register_model)
    @api.doc(security=None)
    @api.response(201, 'Created')
    @api.response(400, 'Bad Request')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Register a new user"""
        data = request.json
        try:
            security = current_app.extensions['security']
            passwrd = data.get('password')
            del data['password']
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
                active=True
                                                  )

            security.datastore.db.session.add(user)
            security.datastore.db.session.commit()

            return {'message': 'User registered successfully'}, 201
        except ValueError as e:
            current_app.extensions['security'].datastore.db.session.rollback()
            return {'error': str(e)}, 400
        except IntegrityError as e:
            current_app.extensions['security'].datastore.db.session.rollback()
            # Check if it's specifically a unique constraint violation
            if 'unique' in str(e).lower():
                return {'error': 'User already exists'}, 400
            else:
                return {'error': 'Database integrity error'}, 400

        except Exception as e:
            return {'error': str(e)}, 500




@api.route('/register_airline')
class AirlineRegister(Resource):
    @api.expect(airline_register_model)
    @api.doc(security=None)
    @api.response(201, 'Created')
    @api.response(400, 'Bad Request')
    @api.response(500, 'Internal Server Error')
    def post(self):
        """Register a new airline"""
        data = request.json
        user_info = data['user_info']
        #create schema airline using marshmellow
        del data['user_info']
        db = current_app.extensions['security'].datastore.db.session
        try:
            with db.begin():
                airline = airline_schema.load(data=data, session=db,partial=True)
                db.add(airline)
                db.flush()
                print(airline)
                tmp_passwd = generate_secure_password()
                print(f"Generated temporary password: {tmp_passwd}")

                security = current_app.extensions['security']
                user = security.datastore.create_user(
                    email=data['email'],
                    password=hash_password(tmp_passwd),
                    roles=["airline-admin"],
                    name=user_info['name'],
                    surname=user_info['surname'],
                    address=user_info.get('address'),
                    zip=user_info.get('zip'),
                    airline_id=airline.id,
                    nation_id=user_info.get('nation_id'),
                    active=False
                )


                db.add(user)
                db.commit()

                return {'message': 'Airline registered successfully'}, 201
        except IntegrityError as e:
            db.rollback()
            # Check if it's specifically a unique constraint violation
            if 'unique' in str(e).lower():
                return {'error': 'User or Airline already exists'}, 400
            else:
                return {'error': 'Database integrity error'}, 400
                
        except Exception as e:
            db.rollback()
            current_app.logger.error(f"Error during airline registration: {str(e)}")
            return {'error': 'Error during airline registration'}, 500
        