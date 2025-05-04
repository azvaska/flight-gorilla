# app/apis/login.py
from flask_jwt_extended import create_access_token
from flask_restx import Namespace, Resource, fields
from flask import request,current_app
from app.models.user import User
from app.extensions import db
from flask_login import login_user, logout_user, login_required, current_user


api = Namespace('auth', description='Login related operations')

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
    def post(self):
        data = request.get_json(force=True)
        email = data.get("email")
        password = data.get("password")
        datastore = current_app.extensions['security'].datastore
        user = datastore.find_user(email=email)
        if not user:
            return {"error": "Invalid credentials"}, 401

        verified = user.verify_and_update_password(password)
        if not verified:
            return {"error": "Invalid credentials"}, 401

        if not user.active:
            return {"error": "User is inactive"}, 403

        token = create_access_token(identity=str(user.id))

        return {
            "message": "Login successful",
            "access_token": token,
            "user": {
                "id": str(user.id),
                "email": user.email
            }
        }, 200


@api.route('/register')
class Register(Resource):
    @api.expect(register_model)
    def post(self):
        """Register a new user"""
        data = request.json

        if User.query.filter_by(username=data.get('username')).first():
            return {'message': 'Username already exists'}, 400

        if User.query.filter_by(email=data.get('email')).first():
            return {'message': 'Email already exists'}, 400

        user = User(
            username=data.get('username'),
            email=data.get('email'),
            role_id=data.get('role_id')
        )
        user.set_password(data.get('password'))

        db.session.add(user)
        db.session.commit()

        return {'message': 'User registered successfully'}, 201