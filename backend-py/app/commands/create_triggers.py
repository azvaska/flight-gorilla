from flask import current_app
from flask.cli import with_appcontext
import click
from sqlalchemy import text


@click.command('create-triggers')
@with_appcontext
def create_triggers():
    db_session = current_app.extensions['sqlalchemy'].session
    click.echo('Creating database triggers...')
    with open('./init/trigger.sql', 'r') as f:
        sql = f.read()
        db_session.execute(text(sql))

    db_session.commit()
    click.echo('Triggers created successfully.')
    db_session.close()

def init_app(app):
    app.cli.add_command(create_triggers)

