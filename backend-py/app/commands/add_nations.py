from flask import current_app
from flask.cli import with_appcontext
import click
from sqlalchemy import text


@click.command('seed-nations')
@with_appcontext
def seed_nations():
    db_session = current_app.extensions['sqlalchemy'].session
    click.echo('Seeding nations into the database...')
    with open('./init/nation.sql', 'r') as f:
        sql = f.read()
        for statement in sql.split(';'):
            stmt = statement.strip()
            if stmt:

                db_session.execute(text(stmt))
    
    db_session.commit()
    db_session.close()

def init_app(app):
    app.cli.add_command(seed_nations)

