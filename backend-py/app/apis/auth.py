from flask_jwt_extended import create_access_token, create_refresh_token
from flask_restx import Namespace, Resource, fields, marshal
from flask import request,current_app
from flask_security import hash_password
from app.models.user import User
from flask_login import login_user

api = Namespace('auth', description='Login related operations',security=None)

login_model_input  = api.model('Login', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password'),
})

user_model = api.model('User', {
    'id': fields.String(required=True, description='User ID'),
})

login_model_output = api.model('LoginOutput', {
    'access_token': fields.String(required=True, description='Access Token'),
    'refresh_token': fields.String(required=True, description='Refresh Token'),
    'user': fields.Nested(user_model, required=True, description='User')
})

register_model = api.model('Register', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password'),
})

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

            if not user.active:
                return {"error": "User is not active"}, 403
            login_user(user)
            token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))

            return marshal({
                "access_token": token,
                "refresh_token": refresh_token,
                "user": {
                        "id": str(user.id),
                    }
                },login_model_output), 200
        except Exception as e:
            return {"error": str(e)}, 500


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

        if User.query.filter_by(email=data.get('email')).first():
            return {'error': 'Email already exists'}, 400
        
        try:
            security = current_app.extensions['security']
            user = security.datastore.create_user(email=data.get('email'),
            password=hash_password(data.get('password')), roles=["user"],
                                                  name='tessts',surname="tesfdst")
            # db.session.add(user)
            security.datastore.db.session.commit()

            return {'message': 'User registered successfully'}, 201
        except Exception as e:
            return {'error': str(e)}, 500
