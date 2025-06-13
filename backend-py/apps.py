import datetime

from flask_cors import CORS

import os

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_security import SQLAlchemySessionUserDatastore, Security
from sqlalchemy import text

from app.commands import init_app as init_commands
from config import Config
from flask_login import LoginManager
from app.apis import api
from app.models.user import User, Role

app_flask = Flask(__name__)
CORS(app_flask, supports_credentials=True, allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"])
app_flask.config.from_object(Config)
login = LoginManager(app_flask)
import logging

logging.basicConfig()



from app.extensions import db, ma, db_session, scheduler

db.init_app(app_flask)
init_commands(app_flask)
app_flask.teardown_appcontext(lambda exc: db_session.close())
app_flask.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", 'pf9Wkove4IKEAXvy-cQkeDPhv9Cb3Ag-wyJILbq_dFw')

app_flask.config['SECURITY_PASSWORD_SALT'] = os.environ.get("SECURITY_PASSWORD_SALT",
                                                      '146585145368132386173505678016728509634')
jwt = JWTManager(app_flask)



with app_flask.app_context():

    api.init_app(app_flask)
    # app_flask.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
    ma.init_app(app_flask)
    api.handle_errors = False  # Disable Flask-RESTful
    user_datastore = SQLAlchemySessionUserDatastore(db_session, User, Role)
    security = Security(app_flask, user_datastore,register_blueprint=False)

    scheduler.schedule(
        scheduled_time=datetime.datetime.now(datetime.UTC),
        func="task.update_airline_stats_cache",
        interval=3600,  # every hour
        repeat=None
    )
    scheduler.schedule(
        scheduled_time=datetime.datetime.now(datetime.UTC),
        func="task.free_sessions",
        interval=60,  # every minute
        repeat=None
    )

    # Create the database tables
    try:
        with db.engine.begin() as conn:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS pg_trgm'))
    except Exception as e:
        print(f"Extension already exists or error: {e}")

    db.metadata.create_all(bind=db_session.bind, checkfirst=True)
    

if __name__ == '__main__':
    # dashboard.bind(app_flask)  # Should be added after all endpoints have been defined
    app_flask.run()
