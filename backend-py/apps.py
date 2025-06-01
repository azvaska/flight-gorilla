
from flask_cors import CORS

import os

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_security import SQLAlchemySessionUserDatastore, Security

from app.commands import init_app as init_commands
from app.models import Airline
from app.tasks.task import register_task
from config import Config
from flask_login import LoginManager
from app.apis import api
from app.models.user import User, Role

app_flask = Flask(__name__)
CORS(app_flask, supports_credentials=True, allow_headers=["Content-Type", "Authorization"])
app_flask.config.from_object(Config)
login = LoginManager(app_flask)
import logging

# logging.basicConfig()
# logging.getLogger('apscheduler').setLevel(logging.DEBUG)

from app.extensions import db, ma, db_session, scheduler

db.init_app(app_flask)
init_commands(app_flask)
app_flask.teardown_appcontext(lambda exc: db_session.close())
app_flask.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", 'pf9Wkove4IKEAXvy-cQkeDPhv9Cb3Ag-wyJILbq_dFw')
# Generate a good salt for password hashing using: secrets.SystemRandom().getrandbits(128)
app_flask.config['SECURITY_PASSWORD_SALT'] = os.environ.get("SECURITY_PASSWORD_SALT",
                                                      '146585145368132386173505678016728509634')
jwt = JWTManager(app_flask)



with app_flask.app_context():
    import app.models

    register_task(scheduler, app_flask)
    api.init_app(app_flask)
    ma.init_app(app_flask)
    api.handle_errors = False  # Disable Flask-RESTful
    scheduler.init_app(app_flask)
    scheduler.start()
    user_datastore = SQLAlchemySessionUserDatastore(db_session, User, Role)
    security = Security(app_flask, user_datastore,register_blueprint=False)
    # Create the database tables
    db.metadata.create_all(bind=db_session.bind, checkfirst=True)
    

if __name__ == '__main__':
    app_flask.run()
