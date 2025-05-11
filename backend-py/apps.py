from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_marshmallow import Marshmallow
from flask_security import SQLAlchemySessionUserDatastore, Security, hash_password
import os

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_security import SQLAlchemySessionUserDatastore, Security

from app.commands.add_aircraft import seed_aircraft
from app.commands.add_airports import seed_airports
from app.commands.add_flight import seed_airline_aircraft
from app.models import Airline
from config import Config
from flask_login import LoginManager
from app.apis import api
from app.models.user import User, Role

app_flask = Flask(__name__)
CORS(app_flask)
app_flask.config.from_object(Config)
login = LoginManager(app_flask)
from app.extensions import db,ma, db_session

db.init_app(app_flask)
app_flask.cli.add_command(seed_airports)
app_flask.cli.add_command(seed_aircraft)
app_flask.cli.add_command(seed_airline_aircraft)
app_flask.teardown_appcontext(lambda exc: db_session.close())
app_flask.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", 'pf9Wkove4IKEAXvy-cQkeDPhv9Cb3Ag-wyJILbq_dFw')
# Generate a good salt for password hashing using: secrets.SystemRandom().getrandbits(128)
app_flask.config['SECURITY_PASSWORD_SALT'] = os.environ.get("SECURITY_PASSWORD_SALT",
                                                      '146585145368132386173505678016728509634')

jwt = JWTManager(app_flask)



with app_flask.app_context():
    import app.models

    api.init_app(app_flask)
    ma.init_app(app_flask)
    api.handle_errors = False  # Disable Flask-RESTful
    user_datastore = SQLAlchemySessionUserDatastore(db_session, User, Role)
    security = Security(app_flask, user_datastore,register_blueprint=False)
    # Create the database tables
    db.metadata.create_all(bind=db_session.bind, checkfirst=True)
    # Create a user and role to test with

    security.datastore.find_or_create_role(
        name="user", permissions={"user-read", "user-write"}
    )
    security.datastore.find_or_create_role(
        name="airline-admin", permissions={"airline-admin-read", "airline-admin-write"}
    )
    db_session.commit()
    if os.getenv('ADD_DEFAULT_USER') == 'true':
        if not security.datastore.find_user(email="a@a.c"):
            security.datastore.create_user(email="a@a.c",
            password=hash_password("a"), roles=["user"],name='tesst',surname="test")

            ar  = Airline(
    name="Sky High Airlines",
    address="123 Aviation Blvd, New York, NY",
    zip="10001",
    nation_id=1,  # Assuming a valid nation ID exists in the database
    email="contact@skyhighairlines.com",
    website="https://www.skyhighairlines.com",
    is_approved=True,
    first_class_description="Luxurious seating with gourmet meals and premium services.",
    business_class_description="Comfortable seating with excellent meals and services.",
    economy_class_description="Affordable seating with basic amenities for a comfortable journey."
)
            db_session.commit()
            security.datastore.create_user(email="a",
            password=hash_password("a"), roles=["airline-admin"],name='Sky',surname="test",airline_id=ar.id)
        db_session.commit()

if __name__ == '__main__':
    app_flask.run()
