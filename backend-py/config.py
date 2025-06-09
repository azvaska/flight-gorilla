import os
import dotenv
dotenv.load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))


import os
from datetime import timedelta

class Config:
    # Core settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "options": "-c timezone=UTC"
        }
    }

    # Flask-Security
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT', 'default-salt')
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authorization"
    SECURITY_TOKEN_AUTHENTICATION_KEY='token',
    SECURITY_TOKEN_AUTHENTICATION_BACKEND = 'jwt',
    # SECURITY_PASSWORD_HASH = "bcrypt"  # good default
    SECURITY_REGISTERABLE = False      # disable if using custom registration
    SECURITY_SEND_REGISTER_EMAIL = False
    SECURITY_CSRF_PROTECT_MECHANISMS = []  # disable CSRF for API
    WTF_CSRF_ENABLED = False               # disable CSRF globally if API-only
    SECURITY_LOGIN_URL = None              # disables default login view
    SECURITY_LOGOUT_URL = None             # disables default logout
    SECURITY_REGISTER_URL = None           # disables default register view
    SECURITY_RECOVERABLE = False           # disable reset password endpoints
    SECURITY_CHANGEABLE = True            # disable change password
    SECURITY_CONFIRMABLE = False           # disable email confirmation
    SECURITY_TRACKABLE = False
    RESTX_VALIDATE = True
    SCHEDULER_API_ENABLED = True
    PROPAGATE_EXCEPTIONS = True
    # JWT Settings (Flask-JWT-Extended)
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-this-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=120)  # 2 hours
    JWT_TOKEN_LOCATION = ['headers']  # Allow tokens in headers and cookies

    MAIL_SERVER = 'smtp.example.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'your_email@example.com'
    MAIL_PASSWORD = 'your_password'
    MAIL_DEFAULT_SENDER = ('Your Name', 'your_email@example.com')

    # Optional for logging/debugging
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
    TESTING = os.environ.get("FLASK_TESTING", "0") == "1"
