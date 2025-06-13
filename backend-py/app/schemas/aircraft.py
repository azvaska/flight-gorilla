from marshmallow import validate
from app.extensions import ma
from app.models.aircraft import Aircraft

class AircraftSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Aircraft
        load_instance = True

    # Add validation to specific fields
    name = ma.String(required=True, validate=validate.Length(min=2, max=100),
                      error_messages={"required": "Name is required", "invalid": "Invalid name format"})
    rows = ma.Integer(required=True, validate=validate.Range(min=1),
                      error_messages={"required": "Rows are required", "invalid": "Rows must be at least 1"})
    columns = ma.Integer(required=True, validate=validate.Range(min=1),
                         error_messages={"required": "Columns are required", "invalid": "Columns must be at least 1"})


aircraft_schema = AircraftSchema()
aircrafts_schema = AircraftSchema(many=True) 
