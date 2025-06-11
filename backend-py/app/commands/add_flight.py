import datetime
import click
from flask.cli import with_appcontext
from app.extensions import db_session
from app.models import Flight, Airport
from app.models.airlines import Airline, AirlineAircraft
from app.models.flight import Route
import random
import math
from typing import List, Dict, Tuple

# Major worldwide airports with realistic data - EXPANDED
WORLD_AIRPORTS = {
    # Europe - Major hubs
    'LHR': {'name': 'London Heathrow', 'city': 'London', 'country': 'UK', 'lat': 51.4700, 'lon': -0.4543, 'timezone_offset': 0},
    'CDG': {'name': 'Charles de Gaulle', 'city': 'Paris', 'country': 'France', 'lat': 49.0097, 'lon': 2.5479, 'timezone_offset': 1},
    'FRA': {'name': 'Frankfurt Airport', 'city': 'Frankfurt', 'country': 'Germany', 'lat': 50.0379, 'lon': 8.5622, 'timezone_offset': 1},
    'AMS': {'name': 'Amsterdam Schiphol', 'city': 'Amsterdam', 'country': 'Netherlands', 'lat': 52.3105, 'lon': 4.7683, 'timezone_offset': 1},
    'MAD': {'name': 'Madrid Barajas', 'city': 'Madrid', 'country': 'Spain', 'lat': 40.4839, 'lon': -3.5680, 'timezone_offset': 1},
    'FCO': {'name': 'Rome Fiumicino', 'city': 'Rome', 'country': 'Italy', 'lat': 41.8003, 'lon': 12.2389, 'timezone_offset': 1},
    'MUC': {'name': 'Munich Airport', 'city': 'Munich', 'country': 'Germany', 'lat': 48.3537, 'lon': 11.7750, 'timezone_offset': 1},
    'ZUR': {'name': 'Zurich Airport', 'city': 'Zurich', 'country': 'Switzerland', 'lat': 47.4647, 'lon': 8.5492, 'timezone_offset': 1},
    'VIE': {'name': 'Vienna Airport', 'city': 'Vienna', 'country': 'Austria', 'lat': 48.1103, 'lon': 16.5697, 'timezone_offset': 1},
    'CPH': {'name': 'Copenhagen Airport', 'city': 'Copenhagen', 'country': 'Denmark', 'lat': 55.6180, 'lon': 12.6506, 'timezone_offset': 1},
    'ARN': {'name': 'Stockholm Arlanda', 'city': 'Stockholm', 'country': 'Sweden', 'lat': 59.6519, 'lon': 17.9186, 'timezone_offset': 1},
    'OSL': {'name': 'Oslo Airport', 'city': 'Oslo', 'country': 'Norway', 'lat': 60.1939, 'lon': 11.1004, 'timezone_offset': 1},
    'HEL': {'name': 'Helsinki Airport', 'city': 'Helsinki', 'country': 'Finland', 'lat': 60.3172, 'lon': 24.9633, 'timezone_offset': 2},
    'BCN': {'name': 'Barcelona Airport', 'city': 'Barcelona', 'country': 'Spain', 'lat': 41.2974, 'lon': 2.0833, 'timezone_offset': 1},
    'LIS': {'name': 'Lisbon Airport', 'city': 'Lisbon', 'country': 'Portugal', 'lat': 38.7813, 'lon': -9.1363, 'timezone_offset': 0},
    'BRU': {'name': 'Brussels Airport', 'city': 'Brussels', 'country': 'Belgium', 'lat': 50.9014, 'lon': 4.4844, 'timezone_offset': 1},
    'DUB': {'name': 'Dublin Airport', 'city': 'Dublin', 'country': 'Ireland', 'lat': 53.4213, 'lon': -6.2701, 'timezone_offset': 0},
    'WAW': {'name': 'Warsaw Chopin', 'city': 'Warsaw', 'country': 'Poland', 'lat': 52.1657, 'lon': 20.9671, 'timezone_offset': 1},
    'PRG': {'name': 'Prague Airport', 'city': 'Prague', 'country': 'Czech Republic', 'lat': 50.1008, 'lon': 14.2632, 'timezone_offset': 1},
    'ATH': {'name': 'Athens Airport', 'city': 'Athens', 'country': 'Greece', 'lat': 37.9364, 'lon': 23.9445, 'timezone_offset': 2},
    
    # Italy - Extended coverage
    'MXP': {'name': 'Milan Malpensa', 'city': 'Milan', 'country': 'Italy', 'lat': 45.6306, 'lon': 8.7281, 'timezone_offset': 1},
    'LIN': {'name': 'Milan Linate', 'city': 'Milan', 'country': 'Italy', 'lat': 45.4454, 'lon': 9.2816, 'timezone_offset': 1},
    'VCE': {'name': 'Venice Marco Polo', 'city': 'Venice', 'country': 'Italy', 'lat': 45.5053, 'lon': 12.3519, 'timezone_offset': 1},
    'NAP': {'name': 'Naples Airport', 'city': 'Naples', 'country': 'Italy', 'lat': 40.8860, 'lon': 14.2908, 'timezone_offset': 1},
    'FLR': {'name': 'Florence Airport', 'city': 'Florence', 'country': 'Italy', 'lat': 43.8100, 'lon': 11.2051, 'timezone_offset': 1},
    'BGY': {'name': 'Milan Bergamo', 'city': 'Bergamo', 'country': 'Italy', 'lat': 45.6739, 'lon': 9.7047, 'timezone_offset': 1},
    'BLQ': {'name': 'Bologna Airport', 'city': 'Bologna', 'country': 'Italy', 'lat': 44.5354, 'lon': 11.2887, 'timezone_offset': 1},
    'CTA': {'name': 'Catania Airport', 'city': 'Catania', 'country': 'Italy', 'lat': 37.4668, 'lon': 15.0664, 'timezone_offset': 1},
    'PMO': {'name': 'Palermo Airport', 'city': 'Palermo', 'country': 'Italy', 'lat': 38.1759, 'lon': 13.0910, 'timezone_offset': 1},
    'BRI': {'name': 'Bari Airport', 'city': 'Bari', 'country': 'Italy', 'lat': 41.1389, 'lon': 16.7606, 'timezone_offset': 1},
    'PSA': {'name': 'Pisa Airport', 'city': 'Pisa', 'country': 'Italy', 'lat': 43.6839, 'lon': 10.3927, 'timezone_offset': 1},
    'TSF': {'name': 'Treviso Airport', 'city': 'Treviso', 'country': 'Italy', 'lat': 45.6484, 'lon': 12.1944, 'timezone_offset': 1},
    
    # Additional European airports
    'LGW': {'name': 'London Gatwick', 'city': 'London', 'country': 'UK', 'lat': 51.1481, 'lon': -0.1903, 'timezone_offset': 0},
    'STN': {'name': 'London Stansted', 'city': 'London', 'country': 'UK', 'lat': 51.8860, 'lon': 0.2389, 'timezone_offset': 0},
    'MAN': {'name': 'Manchester Airport', 'city': 'Manchester', 'country': 'UK', 'lat': 51.7281, 'lon': -2.2308, 'timezone_offset': 0},
    'EDI': {'name': 'Edinburgh Airport', 'city': 'Edinburgh', 'country': 'UK', 'lat': 55.9500, 'lon': -3.3725, 'timezone_offset': 0},
    'ORY': {'name': 'Paris Orly', 'city': 'Paris', 'country': 'France', 'lat': 48.7262, 'lon': 2.3647, 'timezone_offset': 1},
    'LYS': {'name': 'Lyon Airport', 'city': 'Lyon', 'country': 'France', 'lat': 45.7256, 'lon': 5.0811, 'timezone_offset': 1},
    'NCE': {'name': 'Nice Airport', 'city': 'Nice', 'country': 'France', 'lat': 43.6584, 'lon': 7.2158, 'timezone_offset': 1},
    'TXL': {'name': 'Berlin Brandenburg', 'city': 'Berlin', 'country': 'Germany', 'lat': 52.3667, 'lon': 13.5033, 'timezone_offset': 1},
    'DUS': {'name': 'Düsseldorf Airport', 'city': 'Düsseldorf', 'country': 'Germany', 'lat': 51.2895, 'lon': 6.7668, 'timezone_offset': 1},
    'HAM': {'name': 'Hamburg Airport', 'city': 'Hamburg', 'country': 'Germany', 'lat': 53.6304, 'lon': 9.9882, 'timezone_offset': 1},
    'IST': {'name': 'Istanbul Airport', 'city': 'Istanbul', 'country': 'Turkey', 'lat': 41.2619, 'lon': 28.7416, 'timezone_offset': 3},
    'SVO': {'name': 'Moscow Sheremetyevo', 'city': 'Moscow', 'country': 'Russia', 'lat': 55.9736, 'lon': 37.4125, 'timezone_offset': 3},
    
    # Major international destinations - EXPANDED
    'JFK': {'name': 'John F Kennedy Intl', 'city': 'New York', 'country': 'USA', 'lat': 40.6413, 'lon': -73.7781, 'timezone_offset': -5},
    'LAX': {'name': 'Los Angeles Intl', 'city': 'Los Angeles', 'country': 'USA', 'lat': 34.0522, 'lon': -118.2437, 'timezone_offset': -8},
    'ORD': {'name': 'Chicago OHare', 'city': 'Chicago', 'country': 'USA', 'lat': 41.9742, 'lon': -87.9073, 'timezone_offset': -6},
    'MIA': {'name': 'Miami International', 'city': 'Miami', 'country': 'USA', 'lat': 25.7959, 'lon': -80.2870, 'timezone_offset': -5},
    'SFO': {'name': 'San Francisco Intl', 'city': 'San Francisco', 'country': 'USA', 'lat': 37.6213, 'lon': -122.3790, 'timezone_offset': -8},
    'BOS': {'name': 'Boston Logan', 'city': 'Boston', 'country': 'USA', 'lat': 42.3656, 'lon': -71.0096, 'timezone_offset': -5},
    'IAD': {'name': 'Washington Dulles', 'city': 'Washington', 'country': 'USA', 'lat': 38.9531, 'lon': -77.4565, 'timezone_offset': -5},
    
    # Middle East & Africa
    'DXB': {'name': 'Dubai International', 'city': 'Dubai', 'country': 'UAE', 'lat': 25.2532, 'lon': 55.3657, 'timezone_offset': 4},
    'DOH': {'name': 'Doha Hamad Intl', 'city': 'Doha', 'country': 'Qatar', 'lat': 25.2731, 'lon': 51.6086, 'timezone_offset': 3},
    'AUH': {'name': 'Abu Dhabi Intl', 'city': 'Abu Dhabi', 'country': 'UAE', 'lat': 24.4330, 'lon': 54.6511, 'timezone_offset': 4},
    'CAI': {'name': 'Cairo International', 'city': 'Cairo', 'country': 'Egypt', 'lat': 30.1219, 'lon': 31.4056, 'timezone_offset': 2},
    'JNB': {'name': 'OR Tambo Intl', 'city': 'Johannesburg', 'country': 'South Africa', 'lat': -26.1367, 'lon': 28.2411, 'timezone_offset': 2},
    'CMN': {'name': 'Casablanca Mohammed V', 'city': 'Casablanca', 'country': 'Morocco', 'lat': 33.3675, 'lon': -7.5898, 'timezone_offset': 1},
    
    # Asia-Pacific
    'NRT': {'name': 'Tokyo Narita', 'city': 'Tokyo', 'country': 'Japan', 'lat': 35.7720, 'lon': 140.3928, 'timezone_offset': 9},
    'HND': {'name': 'Tokyo Haneda', 'city': 'Tokyo', 'country': 'Japan', 'lat': 35.5494, 'lon': 139.7798, 'timezone_offset': 9},
    'ICN': {'name': 'Seoul Incheon', 'city': 'Seoul', 'country': 'South Korea', 'lat': 37.4602, 'lon': 126.4407, 'timezone_offset': 9},
    'SIN': {'name': 'Singapore Changi', 'city': 'Singapore', 'country': 'Singapore', 'lat': 1.3644, 'lon': 103.9915, 'timezone_offset': 8},
    'BKK': {'name': 'Bangkok Suvarnabhumi', 'city': 'Bangkok', 'country': 'Thailand', 'lat': 13.6900, 'lon': 100.7501, 'timezone_offset': 7},
    'KUL': {'name': 'Kuala Lumpur Intl', 'city': 'Kuala Lumpur', 'country': 'Malaysia', 'lat': 2.7456, 'lon': 101.7072, 'timezone_offset': 8},
    'HKG': {'name': 'Hong Kong Intl', 'city': 'Hong Kong', 'country': 'Hong Kong', 'lat': 22.3080, 'lon': 113.9185, 'timezone_offset': 8},
    'PVG': {'name': 'Shanghai Pudong', 'city': 'Shanghai', 'country': 'China', 'lat': 31.1443, 'lon': 121.8083, 'timezone_offset': 8},
    'PEK': {'name': 'Beijing Capital', 'city': 'Beijing', 'country': 'China', 'lat': 40.0801, 'lon': 116.5846, 'timezone_offset': 8},
    'DEL': {'name': 'Delhi Indira Gandhi', 'city': 'Delhi', 'country': 'India', 'lat': 28.5562, 'lon': 77.1000, 'timezone_offset': 5.5},
    'BOM': {'name': 'Mumbai Chhatrapati Shivaji', 'city': 'Mumbai', 'country': 'India', 'lat': 19.0896, 'lon': 72.8656, 'timezone_offset': 5.5},
    'SYD': {'name': 'Sydney Kingsford Smith', 'city': 'Sydney', 'country': 'Australia', 'lat': -33.9399, 'lon': 151.1753, 'timezone_offset': 10},
    'MEL': {'name': 'Melbourne Airport', 'city': 'Melbourne', 'country': 'Australia', 'lat': -37.6690, 'lon': 144.8410, 'timezone_offset': 10},
    
    # Americas
    'YYZ': {'name': 'Toronto Pearson', 'city': 'Toronto', 'country': 'Canada', 'lat': 43.6777, 'lon': -79.6248, 'timezone_offset': -5},
    'YVR': {'name': 'Vancouver Intl', 'city': 'Vancouver', 'country': 'Canada', 'lat': 49.1967, 'lon': -123.1815, 'timezone_offset': -8},
    'MEX': {'name': 'Mexico City Intl', 'city': 'Mexico City', 'country': 'Mexico', 'lat': 19.4363, 'lon': -99.0721, 'timezone_offset': -6},
    'GRU': {'name': 'São Paulo Guarulhos', 'city': 'São Paulo', 'country': 'Brazil', 'lat': -23.4356, 'lon': -46.4731, 'timezone_offset': -3},
    'GIG': {'name': 'Rio de Janeiro Galeão', 'city': 'Rio de Janeiro', 'country': 'Brazil', 'lat': -22.8075, 'lon': -43.2436, 'timezone_offset': -3},
    'SCL': {'name': 'Santiago Arturo Merino Benítez', 'city': 'Santiago', 'country': 'Chile', 'lat': -33.3928, 'lon': -70.7858, 'timezone_offset': -3},
    'BOG': {'name': 'Bogotá El Dorado', 'city': 'Bogotá', 'country': 'Colombia', 'lat': 4.7016, 'lon': -74.1469, 'timezone_offset': -5},
    'EZE': {'name': 'Buenos Aires Ezeiza', 'city': 'Buenos Aires', 'country': 'Argentina', 'lat': -34.8222, 'lon': -58.5358, 'timezone_offset': -3}
}

# Popular European routes (higher frequency) - EXPANDED
POPULAR_EUROPEAN_ROUTES = [
    # UK routes
    ('LHR', 'CDG'), ('LHR', 'FRA'), ('LHR', 'AMS'), ('LHR', 'MAD'), ('LHR', 'FCO'),
    ('LHR', 'MXP'), ('LHR', 'BCN'), ('LHR', 'ZUR'), ('LHR', 'VIE'), ('LHR', 'CPH'),
    ('LGW', 'FCO'), ('LGW', 'BCN'), ('LGW', 'MAD'), ('LGW', 'MXP'), ('LGW', 'VCE'),
    ('STN', 'BGY'), ('STN', 'PSA'), ('STN', 'TSF'), ('MAN', 'AMS'), ('MAN', 'CDG'),
    
    # Major European hubs
    ('CDG', 'FRA'), ('CDG', 'MAD'), ('CDG', 'FCO'), ('CDG', 'AMS'), ('CDG', 'MXP'),
    ('FRA', 'MUC'), ('FRA', 'VIE'), ('FRA', 'ZUR'), ('FRA', 'CPH'), ('FRA', 'FCO'),
    ('AMS', 'CPH'), ('AMS', 'OSL'), ('AMS', 'ARN'), ('AMS', 'FCO'), ('AMS', 'MXP'),
    
    # Italian domestic and European
    ('FCO', 'MXP'), ('FCO', 'VCE'), ('FCO', 'NAP'), ('FCO', 'CTA'), ('FCO', 'PMO'),
    ('MXP', 'FCO'), ('MXP', 'VCE'), ('MXP', 'NAP'), ('MXP', 'BLQ'), ('MXP', 'BRI'),
    ('VCE', 'FCO'), ('VCE', 'MXP'), ('VCE', 'BGY'), ('NAP', 'FCO'), ('NAP', 'MXP'),
    ('BGY', 'CTA'), ('BGY', 'PMO'), ('BGY', 'BRI'), ('BLQ', 'FCO'), ('BLQ', 'MXP'),
    
    # Italy to Europe
    ('FCO', 'CDG'), ('FCO', 'FRA'), ('FCO', 'MAD'), ('FCO', 'BCN'), ('FCO', 'LIS'),
    ('MXP', 'CDG'), ('MXP', 'FRA'), ('MXP', 'ZUR'), ('MXP', 'VIE'), ('MXP', 'MUC'),
    ('VCE', 'FRA'), ('VCE', 'MUC'), ('VCE', 'VIE'), ('VCE', 'ZUR'), ('VCE', 'CPH'),
    ('VCE', 'ARN'), ('VCE', 'OSL'), ('VCE', 'HEL'), ('VCE', 'WAW'), ('VCE', 'PRG'),
    ('VCE', 'ATH'), ('VCE', 'IST'), ('VCE', 'BUD'), ('VCE', 'TLN'), ('VCE', 'LYS'),
    
    # Spanish routes
    ('MAD', 'BCN'), ('MAD', 'LIS'), ('MAD', 'FCO'), ('MAD', 'CDG'),
    ('BCN', 'FCO'), ('BCN', 'CDG'), ('BCN', 'FRA'), ('BCN', 'AMS'),
    
    # German routes
    ('FRA', 'MUC'), ('FRA', 'TXL'), ('FRA', 'DUS'), ('FRA', 'HAM'),
    ('MUC', 'TXL'), ('MUC', 'VIE'), ('MUC', 'ZUR'),
    
    # Nordic routes
    ('CPH', 'ARN'), ('CPH', 'OSL'), ('CPH', 'HEL'), ('ARN', 'OSL'), ('ARN', 'HEL'),
    
    # Eastern Europe
    ('VIE', 'PRG'), ('VIE', 'WAW'), ('FRA', 'WAW'), ('FRA', 'PRG'),
    ('MUC', 'PRG'), ('MUC', 'WAW'), ('CDG', 'WAW'), ('CDG', 'PRG')
]

# Popular intercontinental routes from Europe
INTERCONTINENTAL_ROUTES = [
    # From London
    ('LHR', 'JFK'), ('LHR', 'LAX'), ('LHR', 'ORD'), ('LHR', 'BOS'), ('LHR', 'MIA'),
    ('LHR', 'DXB'), ('LHR', 'SIN'), ('LHR', 'HKG'), ('LHR', 'NRT'), ('LHR', 'SYD'),
    ('LHR', 'YYZ'), ('LHR', 'DEL'), ('LHR', 'BOM'), ('LHR', 'JNB'), ('LHR', 'CAI'),
    
    # From Paris
    ('CDG', 'JFK'), ('CDG', 'LAX'), ('CDG', 'YYZ'), ('CDG', 'DXB'), ('CDG', 'SIN'),
    ('CDG', 'NRT'), ('CDG', 'CMN'), ('CDG', 'CAI'), ('CDG', 'JNB'), ('CDG', 'DEL'),
    
    # From Frankfurt
    ('FRA', 'JFK'), ('FRA', 'ORD'), ('FRA', 'LAX'), ('FRA', 'SFO'), ('FRA', 'DXB'),
    ('FRA', 'SIN'), ('FRA', 'NRT'), ('FRA', 'ICN'), ('FRA', 'PEK'), ('FRA', 'DEL'),
    ('FRA', 'JNB'), ('FRA', 'YYZ'),
    
    # From Amsterdam
    ('AMS', 'JFK'), ('AMS', 'ORD'), ('AMS', 'DXB'), ('AMS', 'SIN'), ('AMS', 'NRT'),
    ('AMS', 'YYZ'), ('AMS', 'JNB'), ('AMS', 'KUL'), ('AMS', 'BKK'),
    
    # From Rome
    ('FCO', 'JFK'), ('FCO', 'MIA'), ('FCO', 'YYZ'), ('FCO', 'DXB'), ('FCO', 'CAI'),
    ('FCO', 'JNB'), ('FCO', 'NRT'), ('FCO', 'DEL'), ('FCO', 'BOM'),
    
    # From Milan
    ('MXP', 'JFK'), ('MXP', 'MIA'), ('MXP', 'DXB'), ('MXP', 'NRT'), ('MXP', 'SIN'),
    ('MXP', 'YYZ'), ('MXP', 'JNB'),
    
    # From Madrid
    ('MAD', 'JFK'), ('MAD', 'MIA'), ('MAD', 'LAX'), ('MAD', 'MEX'), ('MAD', 'BOG'),
    ('MAD', 'SCL'), ('MAD', 'GRU'), ('MAD', 'EZE'), ('MAD', 'CMN'), ('MAD', 'JNB'),
    
    # From Zurich
    ('ZUR', 'JFK'), ('ZUR', 'ORD'), ('ZUR', 'SFO'), ('ZUR', 'DXB'), ('ZUR', 'SIN'),
    ('ZUR', 'NRT'), ('ZUR', 'YYZ'),
    
    # From Munich
    ('MUC', 'JFK'), ('MUC', 'ORD'), ('MUC', 'LAX'), ('MUC', 'DXB'), ('MUC', 'NRT'),
    ('MUC', 'SIN'), ('MUC', 'YYZ'), ('MUC', 'DEL'),
    
    # From Vienna
    ('VIE', 'JFK'), ('VIE', 'ORD'), ('VIE', 'DXB'), ('VIE', 'NRT'), ('VIE', 'SIN'),
    ('VIE', 'YYZ'), ('VIE', 'DEL'), ('VIE', 'BKK'),
    
    # From Istanbul (major hub)
    ('IST', 'JFK'), ('IST', 'ORD'), ('IST', 'LAX'), ('IST', 'DXB'), ('IST', 'SIN'),
    ('IST', 'NRT'), ('IST', 'PEK'), ('IST', 'DEL'), ('IST', 'BOM'), ('IST', 'JNB'),
    ('IST', 'YYZ'), ('IST', 'SYD'), ('IST', 'KUL'), ('IST', 'BKK')
]

def generate_manual_flight(route, airline_aircraft, day=1, hour=12, minute=0, duration_hour=1):
    """Generate a manual flight (from original seed file)"""
    departure_time = datetime.datetime(2026, 1, day, hour, minute, 0, 0, datetime.timezone.utc)
    arrival_time = departure_time + datetime.timedelta(hours=duration_hour, minutes=30)

    flight = Flight(
        route_id=route.id,
        aircraft_id=airline_aircraft.id,
        departure_time=departure_time,
        arrival_time=arrival_time,
        checkin_start_time=departure_time - datetime.timedelta(hours=2),
        checkin_end_time=departure_time - datetime.timedelta(minutes=60),
        boarding_start_time=departure_time - datetime.timedelta(minutes=30),
        boarding_end_time=departure_time - datetime.timedelta(minutes=15),
        price_economy_class=round(random.uniform(100.0, 500.0), 2),
        price_business_class=round(random.uniform(500.0, 1500.0), 2),
        price_first_class=round(random.uniform(1500.0, 3000.0), 2),
        price_insurance=round(random.uniform(20.0, 100.0), 2),
    )
    db_session.add(flight)


class RealisticFlightGenerator:
    def __init__(self):
        self.existing_airports = {}
        self.existing_airlines = []
        self.existing_aircraft = []
        self.flight_numbers_used = set()
        # Start routes at least 2 hours in the future to satisfy the constraint
        self.base_start_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=2)
        
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def calculate_flight_duration(self, distance_km: float) -> int:
        """Calculate realistic flight duration in minutes"""
        # Average commercial speed considering taxi, takeoff, landing
        if distance_km < 500:  # Short haul
            avg_speed = 600  # km/h (slower due to climb/descent ratio)
            ground_time = 45  # minutes
        elif distance_km < 2000:  # Medium haul
            avg_speed = 750
            ground_time = 60
        elif distance_km < 8000:  # Long haul
            avg_speed = 850
            ground_time = 90
        else:  # Ultra long haul
            avg_speed = 900
            ground_time = 120
            
        flight_time = (distance_km / avg_speed) * 60  # Convert to minutes
        return int(flight_time + ground_time)
    
    def calculate_realistic_price(self, distance_km: float, class_type: str, is_popular_route: bool = False, is_intercontinental: bool = False) -> float:
        """Calculate realistic prices based on distance and market factors"""
        base_rates = {
            'economy': 0.08,  # EUR per km
            'business': 0.25,
            'first': 0.45
        }
        
        # Distance-based multipliers
        if distance_km < 500:  # Short haul - higher per km cost
            distance_multiplier = 1.8
        elif distance_km < 1500:  # Medium haul
            distance_multiplier = 1.2
        elif distance_km < 5000:  # Long haul
            distance_multiplier = 1.0
        else:  # Ultra long haul - economies of scale
            distance_multiplier = 0.85
        
        # Base price calculation
        base_price = distance_km * base_rates[class_type] * distance_multiplier
        
        # Market adjustments
        if is_popular_route:
            base_price *= 1.15  # Popular routes cost more
        
        if is_intercontinental:
            base_price *= 1.25  # Intercontinental premium
        
        # Add seasonal/demand variation (±25%)
        variation = random.uniform(0.75, 1.25)
        final_price = base_price * variation
        
        # Ensure minimum prices
        if is_intercontinental:
            min_prices = {'economy': 200, 'business': 800, 'first': 2000}
        else:
            min_prices = {'economy': 45, 'business': 150, 'first': 400}
        
        return max(round(final_price, 2), min_prices[class_type])
    
    def get_or_create_airports(self):
        """Get existing airports or suggest creating them"""
        existing_airports = Airport.query.all()
        
        for airport in existing_airports:
            if airport.iata_code:
                self.existing_airports[airport.iata_code] = airport
        
        click.echo(f"Found {len(self.existing_airports)} airports with IATA codes in database")
        
        # Suggest missing major airports by region
        missing_airports = []
        italian_airports = []
        intercontinental_airports = []
        
        for iata, data in WORLD_AIRPORTS.items():
            if iata not in self.existing_airports:
                if data['country'] == 'Italy':
                    italian_airports.append(f"{iata} - {data['name']} ({data['city']})")
                elif data['country'] not in ['UK', 'France', 'Germany', 'Netherlands', 'Spain', 'Italy', 'Switzerland', 'Austria', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Belgium', 'Ireland', 'Poland', 'Czech Republic', 'Greece']:
                    intercontinental_airports.append(f"{iata} - {data['name']} ({data['city']}, {data['country']})")
                else:
                    missing_airports.append(f"{iata} - {data['name']} ({data['city']})")
        
        if italian_airports:
            click.echo("\n🇮🇹 Missing Italian airports:")
            for airport in italian_airports:
                click.echo(f"  - {airport}")
        
        if intercontinental_airports:
            click.echo("\n🌍 Missing intercontinental airports:")
            for airport in intercontinental_airports[:15]:  # Show first 15
                click.echo(f"  - {airport}")
        
        if missing_airports:
            click.echo("\n🇪🇺 Other missing European airports:")
            for airport in missing_airports[:10]:  # Show first 10
                click.echo(f"  - {airport}")
    
    def generate_unique_flight_number(self, airline_name: str) -> str:
        """Generate a unique flight number"""
        prefix = airline_name[:2].upper()
        
        for _ in range(100):  # Try 100 times to find unique number
            number = random.randint(100, 9999)
            flight_number = f"{prefix}{number}"
            if flight_number not in self.flight_numbers_used:
                self.flight_numbers_used.add(flight_number)
                return flight_number
        
        # Fallback with timestamp
        import time
        timestamp_suffix = str(int(time.time()))[-4:]
        flight_number = f"{prefix}{timestamp_suffix}"
        self.flight_numbers_used.add(flight_number)
        return flight_number
    
    def get_realistic_departure_time(self, base_date: datetime.datetime, is_intercontinental: bool = False) -> datetime.datetime:
        """Generate realistic departure times based on airline scheduling patterns"""
        if is_intercontinental:
            # Intercontinental flights often depart in specific windows
            hour = random.choices(range(24), weights=[
                2, 1, 1, 1, 1, 2,  # 00-05: Red-eye flights
                4, 6, 8, 10, 12, 15,  # 06-11: Morning departures
                10, 8, 6, 8, 10, 12,  # 12-17: Afternoon departures
                15, 12, 8, 6, 4, 2  # 18-23: Evening departures
            ])[0]
        else:
            # Choose hour based on peak times for domestic/European
            hour = random.choices(range(24), weights=[
                1, 1, 1, 1, 1, 2,  # 00-05: Very few flights
                4, 6, 8, 10, 12, 10,  # 06-11: Morning peak
                8, 10, 12, 10, 8, 10,  # 12-17: Afternoon peak
                12, 8, 6, 4, 2, 1  # 18-23: Evening flights
            ])[0]
        
        # Minutes are typically 00, 15, 30, 45 for scheduled flights
        minute = random.choice([0, 15, 30, 45])
        
        return base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    def generate_route_and_flights(self, dep_iata: str, arr_iata: str, airline: Airline, 
                                 aircraft: AirlineAircraft, is_popular: bool = False, 
                                 is_intercontinental: bool = False, create_return_route: bool = True):
        """Generate a route and multiple flights for it"""
        
        # Check if airports exist
        if dep_iata not in self.existing_airports or arr_iata not in self.existing_airports:
            return
        
        dep_airport = self.existing_airports[dep_iata]
        arr_airport = self.existing_airports[arr_iata]
        
        # Calculate route characteristics
        dep_data = dep_airport
        arr_data = arr_airport
        distance = self.calculate_distance(
                dep_data.latitude, dep_data.longitude,
                arr_data.latitude, arr_data.longitude
            )
        flight_duration = self.calculate_flight_duration(distance)
        
        # Create route
        flight_number = self.generate_unique_flight_number(airline.name)
        
        # Route period - start at least 2 hours in the future, end 6 months later
        # Add some randomness to spread route start times over the next few days
        start_delay_hours = random.randint(2, 72)  # 2-72 hours in the future
        period_start = self.base_start_time + datetime.timedelta(hours=start_delay_hours)
        period_end = period_start + datetime.timedelta(days=180)  # 6 months
        
        route = Route(
            departure_airport_id=dep_airport.id,
            arrival_airport_id=arr_airport.id,
            airline_id=airline.id,
            flight_number=flight_number,
            period_start=period_start,
            period_end=period_end
        )
        db_session.add(route)
        db_session.flush()
        
        # Determine flight frequency based on route type and distance
        if is_intercontinental:
            if is_popular:
                flights_per_week = random.randint(7, 14)   # 1-2 times daily for popular long haul
            else:
                flights_per_week = random.randint(3, 7)    # 3-7 times per week
        elif is_popular:
            if distance < 1000:  # Short popular routes - high frequency
                flights_per_week = random.randint(10, 21)  # 1-3 times daily
            else:  # Long popular routes
                flights_per_week = random.randint(7, 14)   # 1-2 times daily
        else:
            if distance < 500:  # Short regional routes
                flights_per_week = random.randint(3, 10)
            elif distance < 2000:  # Medium haul
                flights_per_week = random.randint(2, 7)
            else:  # Long haul
                flights_per_week = random.randint(1, 4)
        
        # Generate flights over the route period
        period_days = (period_end - period_start).days
        total_flights = min((flights_per_week * period_days) // 7, 200)  # Cap at 200 flights per route
        
        # Calculate realistic prices
        economy_price = self.calculate_realistic_price(distance, 'economy', is_popular, is_intercontinental)
        business_price = self.calculate_realistic_price(distance, 'business', is_popular, is_intercontinental)
        first_price = self.calculate_realistic_price(distance, 'first', is_popular, is_intercontinental)
        insurance_price = round(economy_price * random.uniform(0.08, 0.15), 2)
        
        flights_created = 0
        
        # Generate flights spread over the period
        for i in range(total_flights):
            # Calculate days from route start
            if total_flights == 1:
                day_offset = random.randint(0, min(7, period_days))  # First week
            else:
                day_offset = int((i / total_flights) * period_days)
                # Add some randomness within the week
                day_offset += random.randint(-3, 3)
                day_offset = max(0, min(day_offset, period_days - 1))
            
            flight_date = period_start + datetime.timedelta(days=day_offset)
            
            # Ensure flight is not in the past and not too close to current time
            min_departure_time = max(
                self.base_start_time + datetime.timedelta(hours=2),  # At least 2 hours from now
                flight_date
            )
            
            departure_time = self.get_realistic_departure_time(min_departure_time, is_intercontinental)
            arrival_time = departure_time + datetime.timedelta(minutes=flight_duration)
            
            # Ensure times are within route period
            if departure_time < period_start or arrival_time > period_end:
                continue
            
            # Add some price variation (±10%) for each flight
            price_var = random.uniform(0.9, 1.1)
            
            # Adjust check-in times for intercontinental flights
            checkin_hours = 3 if is_intercontinental else 2
            boarding_minutes = 60 if is_intercontinental else 45
            
            flight = Flight(
                route_id=route.id,
                aircraft_id=aircraft.id,
                departure_time=departure_time,
                arrival_time=arrival_time,
                checkin_start_time=departure_time - datetime.timedelta(hours=checkin_hours),
                checkin_end_time=departure_time - datetime.timedelta(minutes=boarding_minutes + 10),
                boarding_start_time=departure_time - datetime.timedelta(minutes=boarding_minutes),
                boarding_end_time=departure_time - datetime.timedelta(minutes=15),
                gate=f"{random.choice(['A', 'B', 'C', 'D'])}{random.randint(1, 30)}",
                terminal=f"{random.randint(1, 4)}",
                price_economy_class=round(economy_price * price_var, 2),
                price_business_class=round(business_price * price_var, 2),
                price_first_class=round(first_price * price_var, 2),
                price_insurance=round(insurance_price * price_var, 2),
                fully_booked=random.choice([False] * 95 + [True] * 5)  # 5% chance of being full
            )
            db_session.add(flight)
            flights_created += 1
        
        # Create return route automatically if requested
        return_flights_created = 0
        if create_return_route:
            return_flight_number = self.generate_unique_flight_number(airline.name)
            
            return_route = Route(
                departure_airport_id=arr_airport.id,
                arrival_airport_id=dep_airport.id,
                airline_id=airline.id,
                flight_number=return_flight_number,
                period_start=period_start,
                period_end=period_end
            )
            db_session.add(return_route)
            db_session.flush()
            
            # Generate return flights with similar frequency
            for i in range(total_flights):
                if total_flights == 1:
                    day_offset = random.randint(0, min(7, period_days))
                else:
                    day_offset = int((i / total_flights) * period_days)
                    day_offset += random.randint(-3, 3)
                    day_offset = max(0, min(day_offset, period_days - 1))
                
                flight_date = period_start + datetime.timedelta(days=day_offset)
                min_departure_time = max(
                    self.base_start_time + datetime.timedelta(hours=2),
                    flight_date
                )
                
                departure_time = self.get_realistic_departure_time(min_departure_time, is_intercontinental)
                arrival_time = departure_time + datetime.timedelta(minutes=flight_duration)
                
                if departure_time < period_start or arrival_time > period_end:
                    continue
                
                price_var = random.uniform(0.9, 1.1)
                checkin_hours = 3
                boarding_minutes = 45
                
                return_flight = Flight(
                    route_id=return_route.id,
                    aircraft_id=aircraft.id,
                    departure_time=departure_time,
                    arrival_time=arrival_time,
                    checkin_start_time=departure_time - datetime.timedelta(hours=checkin_hours),
                    checkin_end_time=departure_time - datetime.timedelta(minutes=boarding_minutes + 10),
                    boarding_start_time=departure_time - datetime.timedelta(minutes=boarding_minutes),
                    boarding_end_time=departure_time - datetime.timedelta(minutes=15),
                    gate=f"{random.choice(['A', 'B', 'C', 'D'])}{random.randint(1, 30)}",
                    terminal=f"{random.randint(1, 4)}",
                    price_economy_class=round(economy_price * price_var, 2),
                    price_business_class=round(business_price * price_var, 2),
                    price_first_class=round(first_price * price_var, 2),
                    price_insurance=round(insurance_price * price_var, 2),
                    fully_booked=False
                )
                db_session.add(return_flight)
                db_session.flush()

                return_flights_created += 1
        
        route_type = "🌍 Intercontinental" if is_intercontinental else ("🇪🇺 Popular" if is_popular else "🛫 Regional")
        if create_return_route:
            click.echo(f"Created {flights_created + return_flights_created} flights ({flights_created} outbound, {return_flights_created} return) for {route_type} route {flight_number}/{return_flight_number}: {dep_iata} ⇄ {arr_iata} "
                      f"({distance:.0f}km, {flight_duration//60}h{flight_duration%60}m)")
        else:
            click.echo(f"Created {flights_created} flights for {route_type} route {flight_number}: {dep_iata} → {arr_iata} "
                      f"({distance:.0f}km, {flight_duration//60}h{flight_duration%60}m)")


    def create_original_test_flights(self):
        """Create the original test flights from the seed file"""
        click.echo("\n🔧 Creating original test flights for development...")
        
        # Get first airline
        airline = Airline.query.first()
        if not airline:
            click.echo("No airlines found. Cannot create original test flights.")
            return 0
        
        # Get airline aircraft
        airline_aircraft = AirlineAircraft.query.filter_by(airline_id=airline.id).first()
        airline_aircraft_sec = AirlineAircraft.query.filter_by(airline_id=airline.id).offset(1).first()
        
        if not airline_aircraft:
            click.echo("No aircraft found for airline. Cannot create original test flights.")
            return 0
        
        original_flights_created = 0
        
        # Get all airports for random route generation
        all_airports = Airport.query.all()
        if len(all_airports) < 5:
            click.echo("Not enough airports for original test flights.")
            return 0
        
        # Generate flights for each aircraft (original logic)
        for aircraft in AirlineAircraft.query.filter_by(airline_id=airline.id).all():
            # Randomly generate a route
            departure_airport = random.choice(all_airports)
            arrival_airport = random.choice(all_airports)
            while arrival_airport.id == departure_airport.id:  # Ensure different airports
                arrival_airport = random.choice(all_airports)

            route = Route(
                departure_airport_id=departure_airport.id,
                arrival_airport_id=arrival_airport.id,
                airline_id=airline.id,
                flight_number=f"{aircraft.tail_number}{random.randint(100, 999)}",
                period_start=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
                period_end=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
            )
            db_session.add(route)
            db_session.flush()

            # Generate random departure time within the next 30 days
            departure_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
                days=random.randint(1, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # Generate random flight duration (e.g., 1 to 10 hours)
            flight_duration_hours = random.randint(1, 10)
            flight_duration_minutes = random.randint(0, 59)
            arrival_time = departure_time + datetime.timedelta(hours=flight_duration_hours, minutes=flight_duration_minutes)

            flight = Flight(
                route_id=route.id,
                aircraft_id=aircraft.id,
                departure_time=departure_time,
                arrival_time=arrival_time,
                checkin_start_time=departure_time - datetime.timedelta(hours=2),
                checkin_end_time=departure_time - datetime.timedelta(minutes=30),
                boarding_start_time=departure_time - datetime.timedelta(minutes=30),
                boarding_end_time=departure_time - datetime.timedelta(minutes=15),
                price_economy_class=round(random.uniform(100.0, 500.0), 2),
                price_business_class=round(random.uniform(500.0, 1500.0), 2),
                price_first_class=round(random.uniform(1500.0, 3000.0), 2),
                price_insurance=round(random.uniform(20.0, 100.0), 2),
            )
            db_session.add(flight)
            original_flights_created += 1
            
            click.echo(f"Created original flight {route.flight_number} from "
                      f"{departure_airport.iata_code or departure_airport.name} to "
                      f"{arrival_airport.iata_code or arrival_airport.name}")

        # Create specific test routes (from original seed file)
        if len(all_airports) >= 5:
            test_routes_data = [
                {'dep': 1, 'arr': 2, 'flight_num': '123', 'day': 1, 'hour': 12, 'duration': 1},
                {'dep': 1, 'arr': 2, 'flight_num': '1N2', 'day': 1, 'hour': 2, 'duration': 1},
                {'dep': 2, 'arr': 3, 'flight_num': '2N3', 'day': 1, 'hour': 6, 'duration': 1},
                {'dep': 2, 'arr': 3, 'flight_num': '2N3S', 'day': 1, 'hour': 6, 'duration': 0},
                {'dep': 3, 'arr': 4, 'flight_num': '3N4', 'day': 1, 'hour': 11, 'duration': 1},
                {'dep': 3, 'arr': 4, 'flight_num': '3N4B', 'day': 1, 'hour': 10, 'duration': 0},
                {'dep': 1, 'arr': 5, 'flight_num': '1N5', 'day': 1, 'hour': 3, 'duration': 1},
                {'dep': 5, 'arr': 4, 'flight_num': '5N4', 'day': 1, 'hour': 8, 'duration': 1},
                {'dep': 1, 'arr': 4, 'flight_num': '1N4', 'day': 1, 'hour': 9, 'duration': 1},
                {'dep': 4, 'arr': 1, 'flight_num': '4N1', 'day': 3, 'hour': 10, 'duration': 1},
            ]
            
            for route_data in test_routes_data:
                # Check if airports exist
                if route_data['dep'] <= len(all_airports) and route_data['arr'] <= len(all_airports):
                    route = Route(
                        departure_airport_id=route_data['dep'],
                        arrival_airport_id=route_data['arr'],
                        airline_id=airline.id,
                        flight_number=route_data['flight_num'],
                        period_start=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
                        period_end=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
                    )
                    db_session.add(route)
                    db_session.flush()
                    
                    aircraft_to_use = airline_aircraft_sec if 'S' in route_data['flight_num'] or 'B' in route_data['flight_num'] else airline_aircraft
                    if not aircraft_to_use:
                        aircraft_to_use = airline_aircraft
                    
                    generate_manual_flight(
                        route, 
                        aircraft_to_use, 
                        route_data['day'], 
                        route_data['hour'], 
                        0, 
                        route_data['duration']
                    )
                    original_flights_created += 1
                    
                    click.echo(f"Created test route {route_data['flight_num']}: "
                              f"Airport {route_data['dep']} → Airport {route_data['arr']}")
        
        return original_flights_created

@click.command('seed-flights')
@click.option('--start-hours', default=2, help='Hours in the future to start generating routes (default: 2)')
@click.option('--max-routes-per-airline', default=30, help='Maximum routes per airline (default: 80)')
@click.option('--include-original', is_flag=True, default=True, help='Include original test flights (default: True)')
@click.option('--include-intercontinental', is_flag=True, default=True, help='Include intercontinental flights (default: True)')
@click.option('--italian-focus', is_flag=True, default=True, help='Focus on Italian airports and routes (default: True)')
@click.option('--roundtrip-probability', default=0.9, help='Probability of creating return routes (default: 0.9)')
@with_appcontext
def generate_comprehensive_flights(start_hours, max_routes_per_airline, include_original, 
                                 include_intercontinental, italian_focus, roundtrip_probability):
    """Generate comprehensive flight data including Italian airports and intercontinental routes"""
     
    generator = RealisticFlightGenerator()
    # Override base start time if specified
    generator.base_start_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=start_hours)
    
    click.echo(f"🚀 Starting comprehensive flight generation...")
    click.echo(f"Routes will start from: {generator.base_start_time.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    click.echo(f"Round-trip probability: {roundtrip_probability * 100:.0f}%")
    if italian_focus:
        click.echo("🇮🇹 Italian focus enabled - extra Italian routes will be created")
    if include_intercontinental:
        click.echo("🌍 Intercontinental routes enabled")
    
    total_flights_created = 0
    
    # Create original test flights first (if requested)
    if include_original:
        original_count = generator.create_original_test_flights()
        total_flights_created += original_count
        click.echo(f"✅ Created {original_count} original test flights")
    
    # Generate realistic flights
    click.echo(f"\n🌍 Generating realistic worldwide flights...")
    generator.get_or_create_airports()
    
    # Get airlines and aircraft
    airlines = Airline.query.all()
    if not airlines:
        click.echo("No approved airlines found. Please create airlines first.")
        return
    
    total_routes_created = 0
    popular_routes_created = 0
    intercontinental_routes_created = 0
    
    for airline in airlines:
        click.echo(f"\nGenerating flights for {airline.name}")
        
        # Get this airline's aircraft
        aircraft_list = AirlineAircraft.query.filter_by(airline_id=airline.id).all()
        if not aircraft_list:
            click.echo(f"No aircraft found for {airline.name}")
            continue
        
        routes_for_airline = 0
        
        # Get available airports that exist in the database
        available_airports = list(generator.existing_airports.keys())
        if len(available_airports) < 2:
            click.echo(f"Not enough airports available. Found: {available_airports}")
            continue
        
        # Generate popular European routes first (if airports exist)
        click.echo("Creating popular European routes...")
        popular_routes_for_airline = 0
        max_popular_routes = max_routes_per_airline // 3  # Third for popular routes (accounting for return routes)
        
        for dep_iata, arr_iata in POPULAR_EUROPEAN_ROUTES:
            if (dep_iata in generator.existing_airports and 
                arr_iata in generator.existing_airports and 
                popular_routes_for_airline < max_popular_routes):
                
                aircraft = random.choice(aircraft_list)
                # Create return route based on probability
                create_return = random.random() < roundtrip_probability
                generator.generate_route_and_flights(dep_iata, arr_iata, airline, aircraft, 
                                                   is_popular=True, create_return_route=create_return)
                popular_routes_for_airline += 2 if create_return else 1
        
        routes_for_airline += popular_routes_for_airline
        popular_routes_created += popular_routes_for_airline
        click.echo(f"Created {popular_routes_for_airline} popular European route pairs")
        
        # Generate intercontinental routes
        intercontinental_routes_for_airline = 0
        if include_intercontinental:
            click.echo("Creating intercontinental routes...")
            max_intercontinental = max_routes_per_airline // 6  # Sixth for intercontinental (accounting for return routes)
            
            for dep_iata, arr_iata in INTERCONTINENTAL_ROUTES:
                if (dep_iata in generator.existing_airports and 
                    arr_iata in generator.existing_airports and 
                    intercontinental_routes_for_airline < max_intercontinental and
                    routes_for_airline < max_routes_per_airline):
                    
                    aircraft = random.choice(aircraft_list)
                    # Higher probability for intercontinental return routes
                    create_return = random.random() < min(roundtrip_probability + 0.1, 1.0)
                    generator.generate_route_and_flights(dep_iata, arr_iata, airline, aircraft, 
                                                       is_popular=True, is_intercontinental=True,
                                                       create_return_route=create_return)
                    route_count = 2 if create_return else 1
                    intercontinental_routes_for_airline += route_count
                    routes_for_airline += route_count
            
            intercontinental_routes_created += intercontinental_routes_for_airline
            click.echo(f"Created {intercontinental_routes_for_airline} intercontinental route pairs")
        
        # Generate additional routes
        click.echo("Creating additional routes...")
        additional_routes = min(15, max_routes_per_airline - routes_for_airline)
        additional_pairs = 0
        
        for _ in range(additional_routes // 2):  # Divide by 2 since we're creating pairs
            if len(available_airports) >= 2:
                dep_iata, arr_iata = random.sample(available_airports, 2)
                aircraft = random.choice(aircraft_list)
                create_return = random.random() < roundtrip_probability
                generator.generate_route_and_flights(dep_iata, arr_iata, airline, aircraft,
                                                   create_return_route=create_return)
                additional_pairs += 2 if create_return else 1
        
        routes_for_airline += additional_pairs
        total_routes_created += routes_for_airline
        click.echo(f"Created {routes_for_airline} total routes for {airline.name}")
    
    # Commit all changes
    try:
        db_session.commit()
        click.echo(f"\n🎉 SUCCESS! Flight generation complete!")
        click.echo(f"📊 Summary:")
        if include_original:
            click.echo(f"   - Original test flights: {original_count}")
        click.echo(f"   - Total realistic routes created: {total_routes_created}")
        click.echo(f"   - Popular European routes: {popular_routes_created}")
        if include_intercontinental:
            click.echo(f"   - Intercontinental routes: {intercontinental_routes_created}")
        click.echo(f"   - Airlines processed: {len(airlines)}")
        click.echo(f"\n✨ New features in this version:")
        click.echo(f"   - 🇮🇹 Extended Italian airport coverage (12 airports)")
        click.echo(f"   - 🌍 Comprehensive intercontinental routes from major European hubs")
        click.echo(f"   - ✈️ Realistic pricing for long-haul flights")
        click.echo(f"   - 🕒 Appropriate check-in times for international flights")
        click.echo(f"   - 🎯 Balanced distribution of route types")
        click.echo(f"   - 📍 Coverage of 70+ worldwide airports")
        click.echo(f"   - 🚀 Major hubs: London, Paris, Frankfurt, Amsterdam, Rome, Milan")
        
    except Exception as e:
        db_session.rollback()
        click.echo(f"❌ Error creating flights: {e}")
        raise
    finally:
        db_session.close()


# Register the command
def init_app(app):
    app.cli.add_command(generate_comprehensive_flights)
