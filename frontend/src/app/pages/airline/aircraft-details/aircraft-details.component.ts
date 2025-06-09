import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IAirlineAircraft } from '@/types/airline/aircraft';
import { firstValueFrom } from 'rxjs';
import { SeatsGridComponent } from '@/app/components/airline/seats-grid/seats-grid.component';
import { SeatClass } from '@/app/pages/airline/aircraft-add/aircraft-add.component';

@Component({
  selector: 'app-aircraft-details',
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmCardDirective,
    NgIcon,
    RouterLink,
    SeatsGridComponent
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './aircraft-details.component.html',
  host: {
    class: 'block w-full h-fit',
  },
})
export class AircraftDetailsComponent implements OnInit {
  protected aircraft: IAirlineAircraft | null = null;
  protected seatsMatrix: SeatClass[][] = [];
  private aircraftId: string = '';

  constructor(
    private route: ActivatedRoute,
    private airlineFetchService: AirlineFetchService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.aircraftId = this.route.snapshot.paramMap.get('aircraftId') || '';
    if (this.aircraftId) {
      this.fetchAircraft();
    }
  }

  private async fetchAircraft() {
    try {
      this.loadingService.startLoadingTask();
      this.aircraft = await firstValueFrom(this.airlineFetchService.getAircraft(this.aircraftId));
      if (this.aircraft) {
        this.buildSeatsMatrix();
      }
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    } finally {
      this.loadingService.endLoadingTask();
    }
  }

  private buildSeatsMatrix() {
    if (!this.aircraft) return;

    const rows = this.aircraft.aircraft.rows;
    const matrix: SeatClass[][] = Array.from({ length: rows }, () => 
      Array(6).fill(SeatClass.UNASSIGNED)
    );

    // Mark unavailable seats
    this.aircraft.aircraft.unavailable_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.UNAVAILABLE;
      }
    });

    // Mark first class seats
    this.aircraft.first_class_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.FIRST;
      }
    });

    // Mark business class seats
    this.aircraft.business_class_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.BUSINESS;
      }
    });

    // Mark economy class seats
    this.aircraft.economy_class_seats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.ECONOMY;
      }
    });

    this.seatsMatrix = matrix;
  }

  private convertSeatNameToRowCol(seatName: string): { row: number; col: number } {
    const row = parseInt(seatName.slice(0, -1), 10) - 1; // Convert seat row to index (1-based to 0-based)
    const col = seatName.slice(-1).toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); // Convert column letter to index (A=0, B=1, ...)
    return { row, col };
  }

  protected readonly SeatClass = SeatClass;
}
