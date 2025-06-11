from flask_restx import Api

from .auth import api as userNSA
from .airport import api as AirportNSA
from .location import api as CityNSA
from .airline import api as AirlineNSA
from .aircraft import api as AircraftNSA
from .booking import api as BookingNSA
from .seat_session import api as SeatSessionNSA
from .flight import api as FlightNSA
from .user import api as UserNSA
from .search import api as SearchNSA
from .admin import api as AdminNSA

authorizations = {
    'JWT': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'Authorization',
        'description': "JWT Authorization header using the **Bearer** scheme. "
                       "Example: `Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci…`"
    }
}


api = Api(
    title='FlightGorilla API',
    version='1.0',
    description='Monkey Volo',
authorizations=authorizations,
    security='JWT'
    # All API metadatas
)

api.add_namespace(userNSA)
api.add_namespace(AirportNSA)
api.add_namespace(CityNSA)
api.add_namespace(AirlineNSA)
api.add_namespace(AircraftNSA)
api.add_namespace(BookingNSA)
api.add_namespace(SeatSessionNSA)
api.add_namespace(FlightNSA)
api.add_namespace(UserNSA)
api.add_namespace(SearchNSA)
api.add_namespace(AdminNSA)
