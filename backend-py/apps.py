from flask import Flask
from flask_jwt_extended import JWTManager
from flask_login import LoginManager
from flask_security import SQLAlchemySessionUserDatastore, Security, hash_password
import os

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_security import SQLAlchemySessionUserDatastore, Security

from app.models.user import User, Role
from config import Config
from flask_login import LoginManager
from app.apis import api

from app.extensions import db_session, db,user_datastore
from app.models.user import User, Role

app_flask = Flask(__name__)
app_flask.config.from_object(Config)
login = LoginManager(app_flask)
from app.extensions import db, db_session

db.init_app(app_flask)

app_flask.teardown_appcontext(lambda exc: db_session.close())
app_flask.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", 'pf9Wkove4IKEAXvy-cQkeDPhv9Cb3Ag-wyJILbq_dFw')
# Generate a good salt for password hashing using: secrets.SystemRandom().getrandbits(128)
app_flask.config['SECURITY_PASSWORD_SALT'] = os.environ.get("SECURITY_PASSWORD_SALT",
                                                      '146585145368132386173505678016728509634')
app_flask.config["JWT_SECRET_KEY"] = "jwt-secret-key"
app_flask.config["SECURITY_LOGIN_URL"] = None
app_flask.config["SECURITY_LOGIN_WITHOUT_CONFIRMATION"] = True
app_flask.config["SECURITY_TOKEN_AUTHENTICATION_HEADER"] = "Authorization"
app_flask.config["WTF_CSRF_ENABLED"] = False  # for APIs
jwt = JWTManager(app_flask)



with app_flask.app_context():
    import app.models

    api.init_app(app_flask)
    user_datastore = SQLAlchemySessionUserDatastore(db_session, User, Role)
    security = Security(app_flask, user_datastore,register_blueprint=False)
    # Create the database tables
    db.metadata.create_all(bind=db_session.bind)
    # Create a user and role to test with
    security.datastore.find_or_create_role(
        name="user", permissions={"user-read", "user-write"}
    )
    db_session.commit()
    if not security.datastore.find_user(email="a@a.c"):
        security.datastore.create_user(email="a@a.c",
        password=hash_password("a"), roles=["user"],name='tesst',surname="test")
    db_session.commit()

if __name__ == '__main__':
    app_flask.run()
