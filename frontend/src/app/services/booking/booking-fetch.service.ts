import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ISeatSession } from '@/types/booking/seat-session';
import { environment } from '@/app/environments/environment';
import { IBooking } from '@/types/booking/booking';

@Injectable({ providedIn: 'root' })
export class BookingFetchService {
  constructor(private http: HttpClient) {}

  public createBooking({
    sessionId,
    departureFlightIds,
    returnFlightIds,
    extras,
    hasInsurance,
  }: {
    sessionId: string;
    departureFlightIds: string[];
    returnFlightIds: string[];
    extras: {
      id: string;
      quantity: number;
    }[];
    hasInsurance: boolean;
  }) {
    return this.http.post<{
      id: string
    }>(
      `${environment.apiUrl}/booking/`,
      {
        session_id: sessionId,
        departure_flights: departureFlightIds,
        return_flights: returnFlightIds,
        extras,
        has_booking_insurance: hasInsurance,
      }
    );
  }

  public getBookings() {
    return this.http.get<IBooking[]>(
      `${environment.apiUrl}/booking/`
    );
  }

  public getBookingById(bookingId: string) {
    return this.http.get<IBooking>(
      `${environment.apiUrl}/booking/${bookingId}`
    );
  }

  public deleteBooking(bookingId: string) {
    return this.http.delete(
      `${environment.apiUrl}/booking/${bookingId}`
    );
  }

  public getSeatSession() {
    return this.http.get<ISeatSession[]>(
      `${environment.apiUrl}/seat_session/`
    );
  }

  public createSeatSession() {
    return this.http.post<ISeatSession>(
      `${environment.apiUrl}/seat_session/`,
      {}
    );
  }

  public getSeatSessionById(seatSessionId: string) {
    return this.http.get<ISeatSession>(
      `${environment.apiUrl}/seat_session/${seatSessionId}`
    );
  }

  public addSeatToSession(seatSessionId: string, seat: string, flightId: string) {
    return this.http.post(
      `${environment.apiUrl}/seat_session/${seatSessionId}`,
      {
        seat_number: seat,
        flight_id: flightId,
      }
    );
  }
}

