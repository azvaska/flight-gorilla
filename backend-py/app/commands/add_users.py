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
        name="admin", permissions={"admin-read", "admin-write"}
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
            surname="test",
            zip="12345",
            address="123 Test St",
            nation_id=1  # Assuming a default nation ID exists
        )
        db_session.commit()
        click.echo("Created default user 'a@a.c'.")
    if not user_datastore.find_user(email="test@test.it"):
        user_datastore.create_user(
            email="test@test.it",
            password=hash_password("test"),
            roles=["user"],
            name='Test',
            surname="Test",
            zip="12345",
            address="123 Test St",
            nation_id=1  # Assuming a default nation ID exists
        )
        db_session.commit()
        click.echo("Created default user 'test@test.it'.")
    
    if not user_datastore.find_user(email="admin@a.c"):
       user_datastore.create_user(
            email="admin@a.c",
            password=hash_password("a"),
            roles=["admin"],
            name='admin',
            surname="test",
        )
       db_session.commit()
       click.echo("Created default admin 'a@a.c'.")
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
            zip="12345",
            address="123 Sky St",
            nation_id=1,  # Assuming a default nation ID exists
            airline_id=airline.id
        )
        db_session.commit()
        click.echo("Created default airline-admin user 'a'.")


def init_app(app):
    app.cli.add_command(seed_users) 
