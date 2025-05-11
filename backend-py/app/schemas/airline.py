from marshmallow import validates, ValidationError, validate
from app.extensions import ma, db
from app.models.airlines import Airline, Extra, AirlineAircraft
from app.models import Nation

class ExtraSchema(ma.SQLAlchemyAutoSchema):
    airline_id = ma.UUID()
    class Meta:
        model = Extra
        load_instance = True
        include_fk = True

class AirlineAircraftSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = AirlineAircraft
        load_instance = True
        include_fk = True

class AirlineSchema(ma.SQLAlchemyAutoSchema):
    nation = ma.Nested('app.schemas.location.NationSchema')
    nation_id = ma.Integer()
    extras = ma.Nested(ExtraSchema, many=True)
    aircraft = ma.Nested(AirlineAircraftSchema, many=True)

    # Add validation to specific fields
    email = ma.Email(required=True,
                            error_messages={"required": "Email is required", "invalid": "Invalid email format"})
    website = ma.URL(schemes=['http', 'https'], require_tld=True,
                            error_messages={"invalid": "Invalid URL format. Must include http:// or https://"})
    name = ma.String(required=True,validate=validate.Length(min=2, max=150),
                            error_messages={"required": "Name is required", "invalid": "Invalid name format"})
    class Meta:
        model = Airline
        # load_instance = True
        include_fk = True

    @validates('nation_id')
    def validate_nation_id(self, value=None,data_key=None):
        if not db.session.get(Nation, value):  # SQLAlchemy 2.0 pattern
            raise ValidationError("Nation with given ID does not exist.")

# Create schema instances
airline_schema = AirlineSchema()
airlines_schema = AirlineSchema(many=True)
extra_schema = ExtraSchema()
extras_schema = ExtraSchema(many=True)
airline_aircraft_schema = AirlineAircraftSchema()
airline_aircrafts_schema = AirlineAircraftSchema(many=True) 
