import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import {OpenApiGeneratorV3} from "@asteasolutions/zod-to-openapi";
import {registry} from "./config/openapi";
import {airportRouter} from "./apis/airport";
import {authRouter} from "./apis/auth";
import {userRouter} from "./apis/user";
import {flightRouter} from "./apis/flight";
import {locationRouter} from "./apis/location";
import {aircraftRouter} from "./apis/aircraft";
import {seatSessionRouter} from "./apis/seat_session";
import {searchRouter} from "./apis/search";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({status: "OK", timestamp: new Date().toISOString()});
});

// API Routes - served at root level
app.use("/airports", airportRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/flight", flightRouter);
app.use("/location", locationRouter);
app.use("/aircraft", aircraftRouter);
app.use("/seat_session", seatSessionRouter);
app.use("/search", searchRouter);

// OpenAPI Documentation - served at root
const generator = new OpenApiGeneratorV3(registry.definitions);
const document = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Flight Gorilla API",
    version: "1.0.0",
    description: "Flight booking and management API",
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: "Development server",
    },
  ],
});

app.use("/", swaggerUi.serve, swaggerUi.setup(document, {
  swaggerOptions: {
    deepLinking: false,
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    docExpansion: "none",
    filter: false,
    showExtensions: false,
    showCommonExtensions: false,
    tryItOutEnabled: true
  }
}));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({error: "Something went wrong!"});
});

// 404 handler
app.use("/{*any}", (req, res) => {
  res.status(404).json({error: "Route not found"});
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/`);
});

export default app;
