import click
from flask.cli import with_appcontext
from flask import current_app
from flask_security import SQLAlchemySessionUserDatastore, hash_password
from app.extensions import db_session
from app.models.user import User, Role

@click.command('seed-users')
@with_appcontext
def seed_users():
    """Seed default roles and users."""
    # Initialize user datastore
    user_datastore = SQLAlchemySessionUserDatastore(db_session, User, Role)

    # Create roles
    user_datastore.find_or_create_role(
        name="user", permissions={"user-read", "user-write"}
    )
    user_datastore.find_or_create_role(
        name="airline-admin", permissions={"airline-admin-read", "airline-admin-write"}
    )
    db_session.commit()

    # Create default user
    if not user_datastore.find_user(email="a@a.c"):
        user_datastore.create_user(
            email="a@a.c",
            password=hash_password("a"),
            roles=["user"],
            name='tesst',
            surname="test"
        )
        db_session.commit()
        click.echo("Created default user 'a@a.c'.")

    # Create default airline-admin user associated with existing airline
    from app.models.airlines import Airline
    airline = db_session.query(Airline).filter_by(name="Sky High Airlines").first()
    if airline and not user_datastore.find_user(email="a"):
        user_datastore.create_user(
            email="a",
            password=hash_password("a"),
            roles=["airline-admin"],
            name='Sky',
            surname="test",
            airline_id=airline.id
        )
        db_session.commit()
        click.echo("Created default airline-admin user 'a'.")


def init_app(app):
    app.cli.add_command(seed_users) 
