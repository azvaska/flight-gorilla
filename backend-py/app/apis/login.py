# app/apis/login.py
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required
from flask_restx import Namespace, Resource, fields
from flask import request,current_app
from flask_security import hash_password, auth_required, auth_token_required

from app.models.user import User, Role
from app.extensions import db
from flask_login import login_user, logout_user, login_required, current_user


api = Namespace('auth', description='Login related operations',security=None)

login_model = api.model('Login', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password')
})

register_model = api.model('Register', {
    'email': fields.String(required=True, description='Email'),
    'password': fields.String(required=True, description='Password'),
    'role_id': fields.Integer(required=False, description='Role ID')
})

@api.route('/login')
class LoginResource(Resource):
    @api.expect(login_model)
    @api.doc(security=None)
    def post(self):
        data = request.get_json(force=True)
        email = data.get("email")
        password = data.get("password")
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(email=email)
        if not user:
            return {"error": "Invalid credentials","code":401}, 401

        verified = user.verify_and_update_password(password)
        if not verified:
            return {"error": "Invalid credentials","code":401}, 401

        if not user.active:
            return {"error": "User is not active","code":403}, 403
        login_user(user)
        token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return {
            "message": "Login successful",
            "access_token": token,
            "refresh_token": refresh_token,
            "user": {
                "id": str(user.id),
            }
        }, 200


@api.route('/register')
class Register(Resource):
    @api.expect(register_model)
    @api.doc(security=None)
    def post(self):
        """Register a new user"""
        data = request.json

        if User.query.filter_by(email=data.get('email')).first():
            return {'message': 'Email already exists'}, 400

        security = current_app.extensions['security']
        user = security.datastore.create_user(email=data.get('email'),
        password=hash_password(data.get('password')), roles=["user"],name='tessts',surname="tesfdst")
        # db.session.add(user)
        security.datastore.db.session.commit()

        return {'message': 'User registered successfully'}, 201