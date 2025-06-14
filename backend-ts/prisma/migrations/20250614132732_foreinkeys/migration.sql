-- DropForeignKey
ALTER TABLE "airline_aircraft" DROP CONSTRAINT "fk_airline_aircraft_airline_id_airline";

-- DropForeignKey
ALTER TABLE "flight" DROP CONSTRAINT "fk_flight_aircraft_id_airline_aircraft";

-- DropForeignKey
ALTER TABLE "flight" DROP CONSTRAINT "fk_flight_route_id_route";

-- DropForeignKey
ALTER TABLE "flight_extra" DROP CONSTRAINT "fk_flight_extra_extra_id_extra";

-- AddForeignKey
ALTER TABLE "airline_aircraft" ADD CONSTRAINT "fk_airline_aircraft_airline_id_airline" FOREIGN KEY ("airline_id") REFERENCES "airline"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "fk_flight_aircraft_id_airline_aircraft" FOREIGN KEY ("aircraft_id") REFERENCES "airline_aircraft"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "fk_flight_route_id_route" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "flight_extra" ADD CONSTRAINT "fk_flight_extra_extra_id_extra" FOREIGN KEY ("extra_id") REFERENCES "extra"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
