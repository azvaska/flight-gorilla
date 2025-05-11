from app.extensions import ma
from app.models.airport import Airport
from app.schemas.location import CitySchema

class AirportSchema(ma.SQLAlchemyAutoSchema):
    city = ma.Nested(CitySchema, only=('id', 'name', 'nation'))
    city_id = ma.Integer()

    class Meta:
        model = Airport
        load_instance = True

# Create schema instances
airport_schema = AirportSchema()
airports_schema = AirportSchema(many=True) 
