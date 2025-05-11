from app.extensions import ma

class FlightSearchResultSchema(ma.Schema):
    class Meta:
        fields = ('id', 'flight_number', 'airline_name', 'airline_id', 'departure_airport',
                  'arrival_airport', 'departure_time', 'arrival_time', 'duration_minutes',
                  'price_economy', 'price_business', 'price_first', 'available_economy_seats',
                  'available_business_seats', 'available_first_seats', 'aircraft_name',
                  'gate', 'terminal')

    id = ma.String()
    flight_number = ma.String()
    airline_name = ma.String()
    airline_id = ma.String()
    departure_airport = ma.String()
    arrival_airport = ma.String()
    departure_time = ma.DateTime(format='iso')
    arrival_time = ma.DateTime(format='iso')
    duration_minutes = ma.Integer()
    price_economy = ma.Float()
    price_business = ma.Float()
    price_first = ma.Float()
    available_economy_seats = ma.Integer()
    available_business_seats = ma.Integer()
    available_first_seats = ma.Integer()
    aircraft_name = ma.String()
    gate = ma.String()
    terminal = ma.String()

# Create schema instance
flight_search_result_schema = FlightSearchResultSchema(many=True) 
