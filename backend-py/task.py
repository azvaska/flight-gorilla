import datetime
import json
from flask import current_app

from app.core.stats import calculate_airline_stats
from app.extensions import db, redis_client
from app.models import SeatSession, Airline


def update_airline_stats_cache():
    """Update airline stats cache - can be called without app parameter"""
    airlines = Airline.query.all()
    for airline in airlines:
        stats = calculate_airline_stats(airline.id)
        redis_client.set(f'airline_stats:{airline.id}', json.dumps(stats))


def free_sessions():
    """Free expired seat sessions"""
    with current_app.app_context():
        to_delete = SeatSession.query.filter(
            SeatSession.session_end_time < datetime.datetime.now(tz=datetime.UTC)).all()
        print(to_delete)
        if not to_delete:
            print("No sessions to delete.")
            return
        for seat in to_delete:
            print(f"Deleting session: {seat.id} with end time: {seat.session_end_time}")
            db.session.delete(seat)
        db.session.commit()
        print("Free sessions task executed successfully.")







