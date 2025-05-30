export interface ISeatSession {
  id: string;
  seats: {
    seat_number: string;
    flight_id: string;
  }[];
  session_start_time: string;
  session_end_time: string;
}
