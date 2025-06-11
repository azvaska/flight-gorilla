import traceback

import redis
from flask_apscheduler import APScheduler
from flask_marshmallow import Marshmallow
from flask_security import SQLAlchemySessionUserDatastore
from flask_security.models import sqla
from flask_sqlalchemy import SQLAlchemy
from rq import Queue
from rq_scheduler import Scheduler


from app.models.base import Base
from config import Config
from sqlalchemy import create_engine, event
from sqlalchemy.orm import scoped_session, sessionmaker

engine = create_engine(Config().SQLALCHEMY_DATABASE_URI,connect_args={"options": "-c timezone=UTC"})


db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
db = SQLAlchemy(model_class=Base)  # ✅ set at creation


ma = Marshmallow()
scheduler = APScheduler()
redis_client = redis.from_url(Config.REDIS_URL)


q = Queue(connection=redis_client)
scheduler = Scheduler(queue=q, connection=redis_client)


sqla.FsModels.set_db_info(base_model=Base)
