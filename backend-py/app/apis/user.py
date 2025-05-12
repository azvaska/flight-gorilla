# app/apis/user.py
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, reqparse
from marshmallow import ValidationError
from app.core.auth import roles_required
from app.models.user import User, PayementCard
from app.schemas.user import UserSchema, user_schema, users_schema, debit_card_schema, debit_cards_schema

api = Namespace('user', description='User related operations')

# --- RESTx Models ---
debit_card_model = api.model('DebitCard', {
    'id': fields.Integer(readonly=True, description='Card ID'),
    'last_4_card': fields.String(required=True, description='Last 4 digits of card'),
    'credit_card_expiration': fields.String(required=True, description='Card expiration date'),
    'circuits': fields.String(required=True, description='Card circuit')
})

user_model = api.model('User', {
    'id': fields.String(readonly=True, description='User ID'),
    'email': fields.String(required=True, description='Email address'),
    'name': fields.String(required=True, description='First name'),
    'surname': fields.String(required=True, description='Last name'),
    'address': fields.String(description='Address'),
    'zip': fields.String(description='ZIP/postal code'),
    'nation_id': fields.Integer(description='Nation ID'),
    'airline_id': fields.String(description='Airline ID'),
    'active': fields.Boolean(description='Account active status'),
})

# --- Request Parsers ---
user_list_parser = reqparse.RequestParser()
user_list_parser.add_argument('email', type=str, help='Filter by email (case-insensitive)', location='args')
user_list_parser.add_argument('name', type=str, help='Filter by name (case-insensitive)', location='args')
user_list_parser.add_argument('active', type=bool, help='Filter by active status', location='args')
user_list_parser.add_argument('role', type=str, help='Filter by role', location='args')

@api.route('/')
class UserList(Resource):
    @jwt_required()
    @roles_required(['admin'])
    @api.expect(user_list_parser)
    def get(self):
        """List all users with optional filtering (admin only)"""
        args = user_list_parser.parse_args()

        query = User.query

        if args['email']:
            query = query.filter(User.email.ilike(f"%{args['email']}%"))
        if args['name']:
            query = query.filter(User.name.ilike(f"%{args['name']}%"))
        if args['active'] is not None:
            query = query.filter(User.active == args['active'])
        if args['role']:
            query = query.join(User.roles).filter(User.roles.any(name=args['role']))

        return users_schema.dump(query.all()), 200

@api.route('/<uuid:user_id>')
@api.param('user_id', 'The user identifier')
class UserResource(Resource):
    @jwt_required()
    def get(self, user_id):
        """Fetch a user given its identifier"""
        current_user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        current_user = datastore.find_user(id=current_user_id)

        # Only allow users to see their own profile or admins to see anyone
        if str(user_id) != current_user_id and not current_user.has_role('admin'):
            return {'error': 'You do not have permission to view this user', 'code': 403}, 403

        user = User.query.get_or_404(user_id)
        return user_schema.dump(user), 200

    @jwt_required()
    @api.expect(user_model)
    def put(self, user_id):
        """Update a user given its identifier"""
        current_user_id = get_jwt_identity()
        datastore = current_app.extensions['security'].datastore
        current_user = datastore.find_user(id=current_user_id)

        # Only allow users to update their own profile or admins to update anyone
        if str(user_id) != current_user_id and not current_user.has_role('admin'):
            return {'error': 'You do not have permission to update this user', 'code': 403}, 403

        user = User.query.get_or_404(user_id)
        data = request.json

        # Prevent changing critical fields unless admin
        if not current_user.has_role('admin'):
            if 'active' in data:
                del data['active']
            if 'airline_id' in data:
                del data['airline_id']

        # Don't allow changing email to an existing one
        if 'email' in data and data['email'] != user.email:
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                return {'error': 'Email already in use', 'code': 400}, 400

        try:
            # Validate with schema
            partial_schema = UserSchema(partial=True)
            validated_data = partial_schema.load(data)

            # Update user fields
            for key, value in data.items():
                if key != 'password' and key != 'roles':  # Handle these separately
                    setattr(user, key, value)

            # If password is being updated
            if 'password' in data and data['password']:
                user.password = current_app.extensions['security'].hash_password(data['password'])

            db.session.commit()
            return user_schema.dump(user), 200

        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

    @jwt_required()
    @roles_required(['admin'])
    def delete(self, user_id):
        """Delete a user given its identifier (admin only)"""
        user = User.query.get_or_404(user_id)

        # Prevent deleting the last admin
        if user.has_role('admin'):
            admin_count = User.query.join(User.roles).filter(User.roles.any(name='admin')).count()
            if admin_count <= 1:
                return {'error': 'Cannot delete the last admin user', 'code': 400}, 400

        db.session.delete(user)
        db.session.commit()

        return {'message': 'User deleted successfully'}, 200

@api.route('/me')
class CurrentUser(Resource):
    @jwt_required()
    def get(self):
        """Get current user profile"""
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        return user_schema.dump(user), 200

@api.route('/cards')
class UserCardsList(Resource):
    @jwt_required()
    def get(self):
        """Get all credit cards for the current user"""
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        return debit_cards_schema.dump(user.cards), 200

    @jwt_required()
    @api.expect(debit_card_model)
    def post(self):
        """Add a new credit card for the current user"""
        user_id = get_jwt_identity()
        data = request.json

        new_card = PayementCard(
            user_id=user_id,
            last_4_card=data['last_4_card'],
            credit_card_expiration=data['credit_card_expiration'],
            circuits=data['circuits']
        )

        db.session.add(new_card)
        db.session.commit()

        return debit_card_schema.dump(new_card), 201

@api.route('/cards/<int:card_id>')
@api.param('card_id', 'The card identifier')
class UserCardResource(Resource):
    @jwt_required()
    def get(self, card_id):
        """Get a specific credit card"""
        user_id = get_jwt_identity()
        card = PayementCard.query.filter_by(id=card_id, user_id=user_id).first_or_404()
        return debit_card_schema.dump(card), 200

    @jwt_required()
    def delete(self, card_id):
        """Delete a credit card"""
        user_id = get_jwt_identity()
        card = PayementCard.query.filter_by(id=card_id, user_id=user_id).first_or_404()

        db.session.delete(card)
        db.session.commit()

        return {'message': 'Card deleted successfully'}, 200
