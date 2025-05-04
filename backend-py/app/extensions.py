from flask_security import SQLAlchemySessionUserDatastore
from flask_security.models import sqla
from flask_sqlalchemy import SQLAlchemy

from app.models.base import Base
from config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

engine = create_engine(Config().SQLALCHEMY_DATABASE_URI)
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
db = SQLAlchemy(model_class=Base)  # ✅ set at creation
sqla.FsModels.set_db_info(base_model=Base)
