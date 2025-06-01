from datetime import datetime

from app.extensions import db
from app.models import SeatSession


def register_task(scheduler, app):
    @scheduler.task('interval', id='free_sessions', minutes=1, misfire_grace_time=30)
    def free_sessions():
        with app.app_context():
            to_delete =  SeatSession.query.filter(SeatSession.session_end_time < datetime.now()).all()
            print(to_delete)
            for seat in to_delete:
                print(f"Deleting session: {seat.id} with end time: {seat.session_end_time}")
                db.session.delete(seat)
                db.session.commit()
        # print("Free sessions task executed successfully.")