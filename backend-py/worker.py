import sys
import os

import redis

from config import Config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rq import Worker, Queue

from apps import app_flask

if __name__ == '__main__':
    redis_conn = redis.from_url(Config.REDIS_URL)
    print(sys.path)
    with app_flask.app_context():
        worker = Worker(["default"], connection=redis_conn)
        worker.work()