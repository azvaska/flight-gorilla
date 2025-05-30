import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ISeatSession } from '@/types/booking/seat-session';
import { environment } from '@/app/environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingFetchService {
  constructor(private http: HttpClient) {}

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
