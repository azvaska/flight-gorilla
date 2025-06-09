import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideArrowRight } from '@ng-icons/lucide';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IAirlineFlight } from '@/types/airline/flight';
import { firstValueFrom } from 'rxjs';
import { formatDate, formatTime } from '@/utils/date';
import { SeatsGridComponent } from '@/app/components/airline/seats-grid/seats-grid.component';
import { SeatClass } from '@/app/pages/airline/aircraft-add/aircraft-add.component';

@Component({
  selector: 'flight-details',
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmCardDirective,
    NgIcon,
    RouterLink,
    SeatsGridComponent
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideArrowRight })],
  templateUrl: './flight-details.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class FlightDetailsComponent implements OnInit {
  protected flight: IAirlineFlight | null = null;
  private flightId: string = '';
  protected seatsMatrix: SeatClass[][] = [];
  protected SeatClass = SeatClass;

  constructor(
    private route: ActivatedRoute,
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.flightId = this.route.snapshot.paramMap.get('flightId') || '';
    if (this.flightId) {
      this.fetchFlight();
    }
  }

  private async fetchFlight() {
    try {
      this.loadingService.startLoadingTask();
      this.flight = await firstValueFrom(this.airlineFetchService.getFlight(this.flightId));
      if (this.flight) {
        this.buildSeatsMatrix();
      }
    } catch (error) {
      console.error('Error fetching flight:', error);
    } finally {
      this.loadingService.endLoadingTask();
    }
  }

  protected formatDate(date: string) {
    return formatDate(new Date(date), 'specific');
  }

  protected formatTime(time: string) {
    return formatTime(new Date(time));
  }

  private buildSeatsMatrix() {
    if (!this.flight) return;

    const rows = this.flight.aircraft.aircraft.rows;
    const matrix: SeatClass[][] = Array.from({ length: rows }, () => 
      Array(6).fill(SeatClass.UNASSIGNED)
    );

    // Mark unavailable seats
    this.flight.aircraft.aircraft.unavailable_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.UNAVAILABLE;
      }
    });

    // Mark first class seats
    this.flight.aircraft.first_class_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.FIRST;
      }
    });

    // Mark business class seats
    this.flight.aircraft.business_class_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.BUSINESS;
      }
    });

    // Mark economy class seats
    this.flight.aircraft.economy_class_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.ECONOMY;
      }
    });

    // Mark occupied seats (booked_seats)
    this.flight.booked_seats.forEach((seat: string) => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = 'occupied' as any;
      }
    });

    this.seatsMatrix = matrix;
  }

  private convertSeatNameToRowCol(seatName: string): { row: number; col: number } {
    // Convert seat name like "1A" to row/col indices
    const match = seatName.match(/^(\d+)([A-F])$/);
    if (!match) return { row: -1, col: -1 };
    
    const row = parseInt(match[1]) - 1; // Convert to 0-based index
    const col = match[2].charCodeAt(0) - 'A'.charCodeAt(0); // A=0, B=1, etc.
    
    return { row, col };
  }

  protected onSeatsMatrixChange(matrix: SeatClass[][]) {
    this.seatsMatrix = matrix;
  }
}
