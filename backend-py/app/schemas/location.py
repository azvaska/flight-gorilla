from app.extensions import ma
from app.models.location import City, Nation

class NationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Nation
        load_instance = True

class CitySchema(ma.SQLAlchemyAutoSchema):
    nation = ma.Nested(NationSchema)
    class Meta:
        model = City
        include_fk = True
        load_instance = True

nation_schema = NationSchema()
nations_schema = NationSchema(many=True)
city_schema = CitySchema()
cities_schema = CitySchema(many=True)
