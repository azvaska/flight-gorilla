
import datetime
from flask import request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import Namespace, Resource, fields, marshal, reqparse
from flask_security import hash_password
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from app.core.auth import roles_required
from app.models.user import User, PayementCard, CardType
from app.schemas.user import UserSchema, user_schema, users_schema, debit_card_schema, debit_cards_schema
from app.extensions import db
from app.apis.location import nation_model, city_model

api = Namespace('user', description='User related operations')

card_type_values = [member.value.upper() for member in CardType]


payement_card_model_input = api.model('DebitCard', {
    'holder_name': fields.String(required=True, description='Card holder full name'),
    'card_name': fields.String(required=True, description='Card name'),
    'last_4_digits': fields.String(required=True, description='Last 4 digits of card'),
    'expiration_date': fields.String(required=True, description='Card expiration date'),
    'circuit': fields.String(required=True, description='Card circuit'),
    'card_type': fields.String(required=True, description='Card type', enum=card_type_values),
})

payement_card_model_output = api.model('DebitCardOutput', {
    'id': fields.Integer(readonly=True, description='Card ID'),
    'holder_name': fields.String(required=True, description='Card holder full name'),
    'card_name': fields.String(required=True, description='Card name'),
    'last_4_digits': fields.String(required=True, description='Last 4 digits of card'),
    'expiration_date': fields.String(required=True, description='Card expiration date'),
    'circuit': fields.String(required=True, description='Card circuit'),
    'card_type': fields.String(required=True, description='Card type', enum=card_type_values),
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

user_output_model = api.model('UserOutput', {
    'id': fields.String(readonly=True, description='User ID'),
    'email': fields.String(required=True, description='Email address'),
    'name': fields.String(required=True, description='First name'),
    'surname': fields.String(required=True, description='Last name'),
    'address': fields.String(description='Address'),
    'zip': fields.String(description='ZIP/postal code'),
    'nation': fields.Nested(nation_model, description='Nation'),
    'airline_id': fields.String(description='Airline ID'),
    'active': fields.Boolean(description='Account active status'),
    'cards': fields.List(fields.Nested(payement_card_model_output), description='List of cards'),
    'type': fields.String(required=True, description='User type (airline or user)',enum=['airline','user']),

})

user_put_model = api.model('UserUpdate', {
    'email': fields.String(required=False, description='Email address'),
    'name': fields.String(required=False, description='First name'),
    'surname': fields.String(required=False, description='Last name'),
    'address': fields.String(required=False, description='Address'),
    'zip': fields.String(required=False, description='ZIP/postal code'),
    'nation_id': fields.Integer(required=False, description='Nation ID'),
})



user_list_parser = reqparse.RequestParser()
user_list_parser.add_argument('email', type=str, help='Filter by email (case-insensitive)', location='args')
user_list_parser.add_argument('name', type=str, help='Filter by name (case-insensitive)', location='args')
user_list_parser.add_argument('active', type=bool, help='Filter by active status', location='args')
user_list_parser.add_argument('role', type=str, help='Filter by role', location='args')

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
        return marshal(user_schema.dump(user),user_model), 200

    @jwt_required()
    @api.expect(user_put_model)
    @api.response(200, 'User updated successfully', user_output_model)
    @api.response(400, 'Bad Request')
    @api.response(403, 'Forbidden')
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
            partial_schema = UserSchema()
            validated_data = partial_schema.load(data,partial=True)

            # Update user fields
            for key, value in data.items():
                if key != 'password' and key != 'roles':  # Handle these separately
                    setattr(user, key, value)


            db.session.commit()
            return marshal(user_schema.dump(user),user_output_model), 200

        except ValidationError as err:
            return {"errors": err.messages, "code": 400}, 400

@api.route('/update_password')
@api.response(500, 'Internal Server Error')
class UpdatePassword(Resource):
    @jwt_required()
    @api.expect(api.model('UpdatePassword', {
        'old_password': fields.String(required=True, description='Current password'),
        'new_password': fields.String(required=True, description='New password')
    }))
    @api.response(200, 'Password updated successfully')
    @api.response(400, 'Bad Request')
    @api.response(403, 'Forbidden')
    def post(self):
        """Update user password"""
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)

        data = request.json
        
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not user.verify_and_update_password(old_password):
            return {'error': 'Old password is incorrect'}, 403
        
        

        user.password = hash_password(new_password)

        user.confirmed_at = datetime.datetime.now(datetime.UTC)  # Ensure user is confirmed
        
        if user.airline_id:
            from app.models import Airline
            updated_airline = Airline.query.get(user.airline_id)
            if not updated_airline:
                return {'error': 'Associated airline not found'}, 404

            required_fields = ['name', 'nation_id', 'address', 'email', 'website','zip',
                               'address',
                               'first_class_description', 'business_class_description',
                               'economy_class_description']

            # Check if all required fields are present and not None
            all_not_none = all(
                getattr(updated_airline, field) is not None
                for field in required_fields
            )

            if all_not_none:
                user.active = True
            db.session.flush()

        db.session.commit()

        return {'message': 'Password updated successfully'}, 200

@api.route('/me')
class CurrentUser(Resource):
    @jwt_required()
    @api.response(200, 'OK', user_output_model)
    @api.response(404, 'Not Found')
    @api.response(500, 'Internal Server Error')
    def get(self):
        """Get current user profile"""
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        return marshal(user_schema.dump(user),user_output_model), 200




@api.route('/cards')
@api.response(500, 'Internal Server Error')
class UserCardsList(Resource):
    @jwt_required()
    @api.response(200, 'OK', payement_card_model_output)
    @api.response(404, 'Not Found')
    def get(self):
        """Get all credit cards for the current user"""
        user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        return marshal(debit_cards_schema.dump(user.cards), payement_card_model_output), 200

    @jwt_required()
    @api.expect(payement_card_model_input)
    @api.response(201, 'Created', payement_card_model_output)
    @api.response(400, 'Bad Request')
    def post(self):
        """Add a new credit card for the current user"""
        user_id = get_jwt_identity()
        data = request.json

        new_card = PayementCard(
            user_id=user_id,
            card_name=data['card_name'],
            holder_name=data['holder_name'],
            last_4_digits=data['last_4_digits'],
            expiration_date=data['expiration_date'],
            circuit=data['circuit'],
            card_type=CardType[data['card_type'].upper()]
        )

        db.session.add(new_card)
        db.session.commit()

        return marshal(debit_card_schema.dump(new_card), payement_card_model_output), 201

@api.route('/cards/<int:card_id>')
@api.param('card_id', 'The card identifier')
@api.response(500, 'Internal Server Error')
class UserCardResource(Resource):
    @jwt_required()
    @api.response(200, 'OK', payement_card_model_output)
    @api.response(404, 'Not Found')
    def get(self, card_id):
        """Get a specific credit card"""
        user_id = get_jwt_identity()
        card = PayementCard.query.filter_by(id=card_id, user_id=user_id).first_or_404()
        return marshal(debit_card_schema.dump(card), payement_card_model_output), 200

    @jwt_required()
    @api.response(200, 'OK')
    @api.response(404, 'Not Found')
    def delete(self, card_id):
        """Delete a credit card"""
        user_id = get_jwt_identity()
        card = PayementCard.query.filter_by(id=card_id, user_id=user_id).first_or_404()

        try:
            db.session.delete(card)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return {'error': 'Card cannot be deleted due to existing dependencies'}, 409

        return {'message': 'Card deleted successfully'}, 200
