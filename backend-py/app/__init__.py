from flask import Flask
from app.extensions import db
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    db.init_app(app)
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)
    from app.search import bp as posts_bp
    app.register_blueprint(posts_bp, url_prefix='/search')
    return app
