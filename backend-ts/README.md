# Flight Gorilla Backend (TypeScript)

A modern TypeScript backend for the Flight Gorilla application using Express, Prisma, and Zod validation.

## Features

- **Express.js** - Fast, unopinionated web framework
- **Prisma** - Type-safe database ORM
- **Zod** - TypeScript-first schema validation
- **OpenAPI/Swagger** - Automatic API documentation
- **TypeScript** - Type safety and modern JavaScript features

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/flight_gorilla?schema=public"
   PORT=3000
   NODE_ENV=development
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run generate
   
   # Run database migrations
   npm run migrate:dev
   
   # Seed the database (optional)
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- **Swagger UI**: http://localhost:3000/api-docs

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run generate` - Generate Prisma client
- `npm run migrate:dev` - Run database migrations in development
- `npm run migrate:deploy` - Deploy migrations to production
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with initial data

## API Endpoints

### Airports
- `GET /api/airports` - List all airports with optional filtering
  - Query parameters: `name`, `city_name`, `nation_name`, `iata_code`, `icao_code`
- `GET /api/airports/:airport_id` - Get specific airport details

## Project Structure

```
src/
├── apis/           # API route handlers
├── config/         # Configuration files (OpenAPI, etc.)
├── schemas/        # Zod validation schemas
├── utils/          # Utility functions and middleware
└── index.ts        # Main application entry point
```

## Development

The codebase follows modern TypeScript best practices:

- **Type Safety**: Full TypeScript coverage with strict mode
- **Validation**: Request/response validation using Zod schemas
- **Documentation**: Automatic OpenAPI documentation generation
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Database**: Type-safe database queries with Prisma

## Migration from Flask

This backend is a TypeScript port of the original Flask Python backend, maintaining API compatibility while adding:

- Better type safety
- Automatic API documentation
- Modern async/await patterns
- Improved error handling
- Better development experience 
