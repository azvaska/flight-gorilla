
-- =============================================================================
-- OPTIMIZED BOOKING VALIDATION TRIGGERS
-- =============================================================================

-- Consolidated function to handle multiple validations for booking flights
-- This reduces the number of trigger executions and database queries
CREATE OR REPLACE FUNCTION validate_flight_booking()
RETURNS TRIGGER AS $$
DECLARE
    total_seats INTEGER;
    booked_seats INTEGER;
    seat_class_type TEXT;
    seat_exists BOOLEAN := FALSE;
BEGIN
    -- Get seat information and total capacity in a single query
    SELECT 
        aas.class_type,
        TRUE,
        COUNT(*) OVER() as total_capacity
    INTO 
        seat_class_type,
        seat_exists,
        total_seats
    FROM flight f
    JOIN airline_aircraft aa ON f.aircraft_id = aa.id
    JOIN airline_aircraft_seat aas ON aa.id = aas.airline_aircraft_id
    WHERE f.id = NEW.flight_id AND aas.seat_number = NEW.seat_number;
    
    -- Validate seat exists
    IF NOT seat_exists THEN
        RAISE EXCEPTION 'Seat % does not exist on this aircraft for flight %', 
            NEW.seat_number, NEW.flight_id;
    END IF;
    
    -- Validate seat class matches booking class
    IF seat_class_type != NEW.class_type THEN
        RAISE EXCEPTION 'Seat % is a % seat, but booking is for % class', 
            NEW.seat_number, seat_class_type, NEW.class_type;
    END IF;
    
    -- Check seat availability (avoid duplicate seat bookings)
    IF TG_TABLE_NAME = 'booking_departure_flight' THEN
        IF EXISTS (SELECT 1 FROM booking_departure_flight 
                   WHERE flight_id = NEW.flight_id AND seat_number = NEW.seat_number) THEN
            RAISE EXCEPTION 'Seat % is already booked on flight %', NEW.seat_number, NEW.flight_id;
        END IF;
    ELSE -- booking_return_flight
        IF EXISTS (SELECT 1 FROM booking_return_flight 
                   WHERE flight_id = NEW.flight_id AND seat_number = NEW.seat_number) THEN
            RAISE EXCEPTION 'Seat % is already booked on flight %', NEW.seat_number, NEW.flight_id;
        END IF;
    END IF;
    
    -- Optimized capacity check: count existing bookings more efficiently
    WITH booking_count AS (
        SELECT COUNT(*) as departure_count
        FROM booking_departure_flight 
        WHERE flight_id = NEW.flight_id
        UNION ALL
        SELECT COUNT(*) as return_count
        FROM booking_return_flight 
        WHERE flight_id = NEW.flight_id
    )
    SELECT SUM(departure_count) INTO booked_seats FROM booking_count;
    
    -- Check capacity (accounting for the new booking)
    IF booked_seats + 1 > total_seats THEN
        RAISE EXCEPTION 'Flight % is fully booked. Cannot add more bookings. Current: %, Capacity: %', 
            NEW.flight_id, booked_seats, total_seats;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimized triggers using the consolidated validation function
CREATE TRIGGER validate_departure_flight_booking
    BEFORE INSERT ON booking_departure_flight
    FOR EACH ROW EXECUTE FUNCTION validate_flight_booking();

CREATE TRIGGER validate_return_flight_booking
    BEFORE INSERT ON booking_return_flight
    FOR EACH ROW EXECUTE FUNCTION validate_flight_booking();



-- Optimized function for checking flight extra limits
-- Added better error handling and null checks
CREATE OR REPLACE FUNCTION check_extra_limits()
RETURNS TRIGGER AS $$
DECLARE
    extra_limit INTEGER;
BEGIN
    -- Validate quantity is positive
    IF NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Extra quantity must be positive. Requested: %', NEW.quantity;
    END IF;
    
    -- Get the limit for this extra on this flight with better error handling
    SELECT fe.limit INTO extra_limit
    FROM flight_extra fe
    WHERE fe.flight_id = NEW.flight_id AND fe.extra_id = NEW.extra_id;
    
    -- Check if the flight extra combination exists
    IF extra_limit IS NULL THEN
        RAISE EXCEPTION 'Extra not available for this flight. Flight: %, Extra: %', 
            NEW.flight_id, NEW.extra_id;
    END IF;
    
    -- Check if the requested quantity exceeds the per-booking limit
    IF NEW.quantity > extra_limit THEN
        RAISE EXCEPTION 'Extra quantity limit exceeded. Maximum allowed per booking: %, Requested: %', 
            extra_limit, NEW.quantity;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_extra_limits
    BEFORE INSERT OR UPDATE ON booking_flight_extra
    FOR EACH ROW EXECUTE FUNCTION check_extra_limits();


-- =============================================================================
-- AIRCRAFT AND ROUTE VALIDATION TRIGGERS  
-- =============================================================================

-- Optimized function to validate aircraft ownership with single query
CREATE OR REPLACE FUNCTION validate_aircraft_ownership()
RETURNS TRIGGER AS $$
DECLARE
    airline_match BOOLEAN;
BEGIN
    -- Check if aircraft and route belong to the same airline in one query
    SELECT (aa.airline_id = r.airline_id) INTO airline_match
    FROM airline_aircraft aa, route r
    WHERE aa.id = NEW.aircraft_id AND r.id = NEW.route_id;
    
    -- Handle case where aircraft or route doesn't exist
    IF airline_match IS NULL THEN
        RAISE EXCEPTION 'Invalid aircraft (%) or route (%) specified', 
            NEW.aircraft_id, NEW.route_id;
    END IF;
    
    IF NOT airline_match THEN
        RAISE EXCEPTION 'Aircraft cannot be assigned to route from different airline. Aircraft: %, Route: %', 
            NEW.aircraft_id, NEW.route_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_aircraft_airline
    BEFORE INSERT OR UPDATE ON flight
    FOR EACH ROW EXECUTE FUNCTION validate_aircraft_ownership();



