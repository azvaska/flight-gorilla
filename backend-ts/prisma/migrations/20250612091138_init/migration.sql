-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "cardtype" AS ENUM ('DEBIT', 'CREDIT', 'PREPAID');

-- CreateEnum
CREATE TYPE "classtype" AS ENUM ('FIRST_CLASS', 'BUSINESS_CLASS', 'ECONOMY_CLASS');

-- CreateTable
CREATE TABLE "aircraft" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "rows" INTEGER NOT NULL,
    "columns" INTEGER NOT NULL,
    "unavailable_seats" VARCHAR[],

    CONSTRAINT "pk_aircraft" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airline" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nation_id" INTEGER,
    "address" VARCHAR(255),
    "zip" VARCHAR(255),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "first_class_description" TEXT,
    "business_class_description" TEXT,
    "economy_class_description" TEXT,

    CONSTRAINT "pk_airline" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airline_aircraft" (
    "id" UUID NOT NULL,
    "aircraft_id" INTEGER NOT NULL,
    "airline_id" UUID NOT NULL,
    "tail_number" VARCHAR(255) NOT NULL,

    CONSTRAINT "pk_airline_aircraft" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "airline_aircraft_seat" (
    "airline_aircraft_id" UUID NOT NULL,
    "seat_number" VARCHAR(255) NOT NULL,
    "class_type" "classtype" NOT NULL,

    CONSTRAINT "pk_airline_aircraft_seat" PRIMARY KEY ("airline_aircraft_id","seat_number")
);

-- CreateTable
CREATE TABLE "airport" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "iata_code" VARCHAR(3),
    "icao_code" VARCHAR(4),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "city_id" INTEGER NOT NULL,

    CONSTRAINT "pk_airport" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" UUID NOT NULL,
    "booking_number" VARCHAR(10) NOT NULL,
    "user_id" UUID NOT NULL,
    "payment_confirmed" BOOLEAN NOT NULL,
    "departure_checkin" TIMESTAMPTZ(6),
    "return_checkin" TIMESTAMPTZ(6),
    "has_booking_insurance" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pk_booking" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_departure_flight" (
    "booking_id" UUID NOT NULL,
    "flight_id" UUID NOT NULL,
    "seat_number" VARCHAR NOT NULL,
    "class_type" "classtype" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pk_booking_departure_flight" PRIMARY KEY ("booking_id","flight_id")
);

-- CreateTable
CREATE TABLE "booking_flight_extra" (
    "booking_id" UUID NOT NULL,
    "flight_id" UUID NOT NULL,
    "extra_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "extra_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pk_booking_flight_extra" PRIMARY KEY ("booking_id","flight_id","extra_id")
);

-- CreateTable
CREATE TABLE "booking_return_flight" (
    "booking_id" UUID NOT NULL,
    "flight_id" UUID NOT NULL,
    "seat_number" VARCHAR NOT NULL,
    "class_type" "classtype" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pk_booking_return_flight" PRIMARY KEY ("booking_id","flight_id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nation_id" INTEGER,

    CONSTRAINT "pk_city" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "airline_id" UUID NOT NULL,
    "required_on_all_segments" BOOLEAN NOT NULL,
    "stackable" BOOLEAN NOT NULL,

    CONSTRAINT "pk_extra" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight" (
    "id" UUID NOT NULL,
    "route_id" INTEGER NOT NULL,
    "aircraft_id" UUID NOT NULL,
    "departure_time" TIMESTAMPTZ(6) NOT NULL,
    "arrival_time" TIMESTAMPTZ(6) NOT NULL,
    "checkin_start_time" TIMESTAMPTZ(6) NOT NULL,
    "checkin_end_time" TIMESTAMPTZ(6) NOT NULL,
    "boarding_start_time" TIMESTAMPTZ(6) NOT NULL,
    "boarding_end_time" TIMESTAMPTZ(6) NOT NULL,
    "gate" VARCHAR(255),
    "terminal" VARCHAR(255),
    "price_first_class" DOUBLE PRECISION NOT NULL,
    "price_business_class" DOUBLE PRECISION NOT NULL,
    "price_economy_class" DOUBLE PRECISION NOT NULL,
    "price_insurance" DOUBLE PRECISION NOT NULL,
    "fully_booked" BOOLEAN NOT NULL,

    CONSTRAINT "pk_flight" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_extra" (
    "id" UUID NOT NULL,
    "flight_id" UUID NOT NULL,
    "extra_id" UUID NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "limit" INTEGER NOT NULL,

    CONSTRAINT "pk_flight_extra" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nation" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "alpha2" VARCHAR(2) NOT NULL,

    CONSTRAINT "pk_nation" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payement_card" (
    "id" SERIAL NOT NULL,
    "card_name" VARCHAR(255) NOT NULL,
    "holder_name" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "last_4_digits" VARCHAR(255) NOT NULL,
    "expiration_date" VARCHAR(255) NOT NULL,
    "circuit" VARCHAR(255) NOT NULL,
    "card_type" "cardtype" NOT NULL,

    CONSTRAINT "pk_payement_card" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(255),
    "permissions" TEXT,
    "update_datetime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_role" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_users" (
    "user_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "pk_roles_users" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "route" (
    "id" SERIAL NOT NULL,
    "flight_number" VARCHAR(255) NOT NULL,
    "departure_airport_id" INTEGER NOT NULL,
    "arrival_airport_id" INTEGER NOT NULL,
    "airline_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pk_route" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat" (
    "session_id" UUID NOT NULL,
    "flight_id" UUID NOT NULL,
    "seat_number" VARCHAR(255) NOT NULL,
    "class_type" "classtype" NOT NULL,

    CONSTRAINT "pk_seat" PRIMARY KEY ("session_id","flight_id")
);

-- CreateTable
CREATE TABLE "seat_session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_start_time" TIMESTAMPTZ(6) NOT NULL,
    "session_end_time" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pk_seat_session" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "surname" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "zip" VARCHAR(255),
    "nation_id" INTEGER,
    "airline_id" UUID,
    "username" VARCHAR(255),
    "active" BOOLEAN NOT NULL,
    "fs_uniquifier" VARCHAR(64) NOT NULL,
    "confirmed_at" TIMESTAMP(6),
    "last_login_at" TIMESTAMP(6),
    "current_login_at" TIMESTAMP(6),
    "last_login_ip" VARCHAR(64),
    "current_login_ip" VARCHAR(64),
    "login_count" INTEGER,
    "tf_primary_method" VARCHAR(64),
    "tf_totp_secret" VARCHAR(255),
    "tf_phone_number" VARCHAR(128),
    "us_totp_secrets" TEXT,
    "us_phone_number" VARCHAR(128),
    "fs_webauthn_user_handle" VARCHAR(64),
    "mf_recovery_codes" TEXT,
    "create_datetime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_datetime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_user" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_aircraft_name" ON "aircraft"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_airline_name" ON "airline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_airline_aircraft_tail_number" ON "airline_aircraft"("tail_number");

-- CreateIndex
CREATE INDEX "ix_airline_aircraft_seat_class" ON "airline_aircraft_seat"("airline_aircraft_id", "class_type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_airport_iata_code" ON "airport"("iata_code");

-- CreateIndex
CREATE INDEX "idx_airport_name_trgm" ON "airport" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ix_airport_city" ON "airport"("city_id");

-- CreateIndex
CREATE INDEX "ix_airport_codes" ON "airport"("iata_code", "icao_code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_booking_booking_number" ON "booking"("booking_number");

-- CreateIndex
CREATE INDEX "ix_booking_number" ON "booking"("booking_number");

-- CreateIndex
CREATE INDEX "ix_booking_user" ON "booking"("user_id");

-- CreateIndex
CREATE INDEX "ix_booking_departure_booking" ON "booking_departure_flight"("booking_id");

-- CreateIndex
CREATE INDEX "ix_booking_departure_flight" ON "booking_departure_flight"("flight_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_booking_departure_flight" ON "booking_departure_flight"("flight_id", "seat_number");

-- CreateIndex
CREATE INDEX "ix_booking_extra_booking" ON "booking_flight_extra"("booking_id");

-- CreateIndex
CREATE INDEX "ix_booking_extra_extra" ON "booking_flight_extra"("extra_id");

-- CreateIndex
CREATE INDEX "ix_booking_extra_flight" ON "booking_flight_extra"("flight_id");

-- CreateIndex
CREATE INDEX "ix_booking_return_booking" ON "booking_return_flight"("booking_id");

-- CreateIndex
CREATE INDEX "ix_booking_return_flight" ON "booking_return_flight"("flight_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_booking_return_flight" ON "booking_return_flight"("flight_id", "seat_number");

-- CreateIndex
CREATE INDEX "idx_city_name_trgm" ON "city" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ix_city_nation" ON "city"("nation_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_extra_name_airline" ON "extra"("name", "airline_id");

-- CreateIndex
CREATE INDEX "ix_flight_departure_time" ON "flight"("departure_time");

-- CreateIndex
CREATE INDEX "ix_flight_fully_booked" ON "flight"("fully_booked");

-- CreateIndex
CREATE INDEX "ix_flight_prices" ON "flight"("price_economy_class", "price_business_class", "price_first_class");

-- CreateIndex
CREATE INDEX "ix_flight_route_departure" ON "flight"("route_id", "departure_time");

-- CreateIndex
CREATE INDEX "ix_flight_search_composite" ON "flight"("route_id", "departure_time", "fully_booked");

-- CreateIndex
CREATE INDEX "ix_flight_extra_extra" ON "flight_extra"("extra_id");

-- CreateIndex
CREATE INDEX "ix_flight_extra_flight" ON "flight_extra"("flight_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_flight_extra" ON "flight_extra"("flight_id", "extra_id");

-- CreateIndex
CREATE INDEX "idx_nation_name_trgm" ON "nation" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ix_nation_alpha2" ON "nation"("alpha2");

-- CreateIndex
CREATE INDEX "ix_payment_card_user" ON "payement_card"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_role_name" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_route_flight_number" ON "route"("flight_number");

-- CreateIndex
CREATE INDEX "ix_route_airline" ON "route"("airline_id");

-- CreateIndex
CREATE INDEX "ix_route_arrival_airport" ON "route"("arrival_airport_id");

-- CreateIndex
CREATE INDEX "ix_route_departure_airport" ON "route"("departure_airport_id");

-- CreateIndex
CREATE INDEX "ix_route_period" ON "route"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "ix_seat_flight_session" ON "seat"("flight_id", "session_id", "seat_number", "class_type");

-- CreateIndex
CREATE UNIQUE INDEX "uix_flight_seat" ON "seat"("flight_id", "seat_number");

-- CreateIndex
CREATE INDEX "ix_seat_session_cleanup" ON "seat_session"("session_end_time");

-- CreateIndex
CREATE INDEX "ix_seat_session_user" ON "seat_session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_email" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_username" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_fs_uniquifier" ON "user"("fs_uniquifier");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_us_phone_number" ON "user"("us_phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_fs_webauthn_user_handle" ON "user"("fs_webauthn_user_handle");

-- CreateIndex
CREATE INDEX "ix_user_active" ON "user"("active");

-- CreateIndex
CREATE INDEX "ix_user_email" ON "user"("email");

-- AddForeignKey
ALTER TABLE "airline" ADD CONSTRAINT "fk_airline_nation_id_nation" FOREIGN KEY ("nation_id") REFERENCES "nation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "airline_aircraft" ADD CONSTRAINT "fk_airline_aircraft_aircraft_id_aircraft" FOREIGN KEY ("aircraft_id") REFERENCES "aircraft"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "airline_aircraft" ADD CONSTRAINT "fk_airline_aircraft_airline_id_airline" FOREIGN KEY ("airline_id") REFERENCES "airline"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "airline_aircraft_seat" ADD CONSTRAINT "fk_airline_aircraft_seat_airline_aircraft_id_airline_aircraft" FOREIGN KEY ("airline_aircraft_id") REFERENCES "airline_aircraft"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "airport" ADD CONSTRAINT "fk_airport_city_id_city" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_user_id_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_departure_flight" ADD CONSTRAINT "fk_booking_departure_flight_booking_id_booking" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_departure_flight" ADD CONSTRAINT "fk_booking_departure_flight_flight_id_flight" FOREIGN KEY ("flight_id") REFERENCES "flight"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_flight_extra" ADD CONSTRAINT "fk_booking_flight_extra_booking_id_booking" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_flight_extra" ADD CONSTRAINT "fk_booking_flight_extra_extra_id_flight_extra" FOREIGN KEY ("extra_id") REFERENCES "flight_extra"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_flight_extra" ADD CONSTRAINT "fk_booking_flight_extra_flight_id_flight" FOREIGN KEY ("flight_id") REFERENCES "flight"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_return_flight" ADD CONSTRAINT "fk_booking_return_flight_booking_id_booking" FOREIGN KEY ("booking_id") REFERENCES "booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "booking_return_flight" ADD CONSTRAINT "fk_booking_return_flight_flight_id_flight" FOREIGN KEY ("flight_id") REFERENCES "flight"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "fk_city_nation_id_nation" FOREIGN KEY ("nation_id") REFERENCES "nation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "extra" ADD CONSTRAINT "fk_extra_airline_id_airline" FOREIGN KEY ("airline_id") REFERENCES "airline"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "fk_flight_aircraft_id_airline_aircraft" FOREIGN KEY ("aircraft_id") REFERENCES "airline_aircraft"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "fk_flight_route_id_route" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight_extra" ADD CONSTRAINT "fk_flight_extra_extra_id_extra" FOREIGN KEY ("extra_id") REFERENCES "extra"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight_extra" ADD CONSTRAINT "fk_flight_extra_flight_id_flight" FOREIGN KEY ("flight_id") REFERENCES "flight"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payement_card" ADD CONSTRAINT "fk_payement_card_user_id_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles_users" ADD CONSTRAINT "fk_roles_users_role_id_role" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles_users" ADD CONSTRAINT "fk_roles_users_user_id_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "fk_route_airline_id_airline" FOREIGN KEY ("airline_id") REFERENCES "airline"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "fk_route_arrival_airport_id_airport" FOREIGN KEY ("arrival_airport_id") REFERENCES "airport"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "route" ADD CONSTRAINT "fk_route_departure_airport_id_airport" FOREIGN KEY ("departure_airport_id") REFERENCES "airport"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seat" ADD CONSTRAINT "fk_seat_flight_id_flight" FOREIGN KEY ("flight_id") REFERENCES "flight"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seat" ADD CONSTRAINT "fk_seat_session_id_seat_session" FOREIGN KEY ("session_id") REFERENCES "seat_session"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seat_session" ADD CONSTRAINT "fk_seat_session_user_id_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "fk_user_airline_id_airline" FOREIGN KEY ("airline_id") REFERENCES "airline"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "fk_user_nation_id_nation" FOREIGN KEY ("nation_id") REFERENCES "nation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
