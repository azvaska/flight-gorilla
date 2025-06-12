# Database Seeding for Flight Gorilla TypeScript Backend

This document explains how to use the database seeding system that has been ported from the Python backend.

## Overview

The seeding system creates realistic test data for the flight booking application, including:

- **Nations**: Countries and their codes
- **Airports**: International airports with IATA/ICAO codes
- **Aircraft**: Various aircraft models with seat configurations
- **Airlines**: Default airline with aircraft fleet
- **Users**: Test users with different roles (user, admin, airline-admin)
- **Flights**: Realistic flight routes with pricing
- **Extras**: Additional services for flights
- **Bookings**: Sample bookings with seat assignments

## Prerequisites

1. **Database Setup**: Ensure your PostgreSQL database is running and accessible
2. **Environment Variables**: Set up your `DATABASE_URL` in a `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/flight_gorilla?schema=public"
   ```
3. **Dependencies**: Install all required packages:
   ```bash
   npm install
   ```
4. **Prisma Setup**: Generate the Prisma client:
   ```bash
   npm run generate
   ```

## Data Files

The seeding system expects certain data files to be present:

### Required Files
- `init/nation.sql` - SQL file containing nation data (from Python backend)
- `airports.csv` - CSV file containing airport data (from Python backend)

### Optional Files
If these files are not found, the seeding will skip those steps and continue with the rest.

## Running the Seed

### Full Seeding Process
To run the complete seeding process:

```bash
npm run db:seed
```

This will execute all seeding functions in the correct order:
1. Nations
2. Airports (with cities)
3. Aircraft
4. Airlines
5. Airline Aircrafts (with seat configurations)
6. Users (with roles)
7. Flights (with routes)
8. Extras
9. Bookings

### Individual Seeding Functions

The seeding is modular. Each function can be imported and used individually if needed:

```typescript
import { PrismaClient } from './generated/prisma';
import { seedNations } from './prisma/seeds/nations';
import { seedAircraft } from './prisma/seeds/aircraft';
// ... other imports

const prisma = new PrismaClient();

// Seed only aircraft
await seedAircraft(prisma);
```

## Seeding Details

### Nations
- Reads from `init/nation.sql` file
- Executes SQL statements to populate nation data
- Skips if file not found

### Airports
- Reads from `airports.csv` file
- Creates cities and nations as needed
- Filters for airport types only
- Handles IATA/ICAO code validation
- Skips duplicates

### Aircraft
- Creates 9 common aircraft models:
  - Wide-body: Boeing 747-400, 777-300ER, Airbus A380-800, A350-900, A330-300
  - Narrow-body: Boeing 737-800, 737 MAX 8, Airbus A320neo, A321LR
- Each with realistic seat configurations

### Airlines
- Creates "Sky High Airlines" as the default airline
- Associates all aircraft with the airline
- Generates unique tail numbers
- Creates seat class distributions:
  - First Class: 10% of rows
  - Business Class: 20% of rows
  - Economy Class: Remaining rows

### Users
- Creates roles: user, admin, airline-admin
- Creates test users:
  - `a@a.c` (user role)
  - `test@test.it` (user role)
  - `admin@a.c` (admin role)
  - `a` (airline-admin role, associated with airline)

### Flights
- Creates realistic European and intercontinental routes
- Generates flights with:
  - Realistic departure/arrival times
  - Proper check-in and boarding windows
  - Distance-based pricing
  - Class-specific pricing (Economy, Business, First)
  - Insurance pricing

### Extras
- Creates airline extras:
  - Extra Meal (stackable)
  - Extra Monkey (required on all segments, non-stackable)
  - Additional Baggage (required on all segments, stackable)
- Associates extras with all flights with random pricing

### Bookings
- Creates realistic bookings with:
  - 60% single-trip, 40% round-trip distribution
  - Realistic class distribution (85% Economy, 12% Business, 3% First)
  - Seat assignments based on availability
  - 30% chance of insurance
  - 40% chance of extras
  - 90% payment confirmation rate

## Business Logic Preservation

The TypeScript seeding system preserves all the business logic from the Python version:

- **Seat Layout Generation**: Same algorithm for generating seat numbers (1A, 1B, etc.)
- **Class Distribution**: Same percentages for first/business/economy class seats
- **Pricing Logic**: Distance-based pricing with class multipliers
- **Route Selection**: Same popular European and intercontinental routes
- **Booking Patterns**: Same realistic booking behavior patterns
- **Data Validation**: Same validation rules for airports, aircraft, etc.

## Error Handling

The seeding system includes comprehensive error handling:
- Skips missing data files gracefully
- Handles duplicate data appropriately
- Provides detailed logging for each step
- Rolls back on critical errors

## Performance Considerations

- Uses batch operations where possible
- Implements proper indexing through Prisma
- Limits the number of generated records for demo purposes
- Uses transactions for data consistency

## Customization

You can customize the seeding by:

1. **Modifying Data**: Edit the arrays in each seed file
2. **Changing Quantities**: Adjust the limits in each seeding function
3. **Adding New Data**: Extend the seeding functions with additional logic
4. **Selective Seeding**: Comment out specific seeding steps in the main seed file

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure `DATABASE_URL` is correct
2. **Missing Files**: Check that `init/nation.sql` and `airports.csv` exist
3. **Permission Errors**: Ensure database user has CREATE/INSERT permissions
4. **Memory Issues**: Reduce the number of generated records if needed

### Logs

The seeding process provides detailed logs:
- ✅ Success indicators for completed steps
- ❌ Error indicators for failed operations
- 📊 Statistics on created records
- ⏭️ Skip indicators for missing data

## Integration with Development Workflow

The seeding system integrates well with development workflows:

```bash
# Reset and seed database
npm run migrate:dev
npm run db:seed

# Or in production
npm run migrate:deploy
npm run db:seed
```

This provides a consistent, realistic dataset for development and testing. 
