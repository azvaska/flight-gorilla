import { Component, Input } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import {
  SeatClass,
  SeatsGridComponent,
} from '@/app/components/booking/seats-grid/seats-grid.component';

import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { Router } from '@angular/router';
import { BookingStateStore } from '@/app/stores/booking-state.store';
import { LoadingService } from '@/app/services/loading.service';
import { FlightFetchService } from '@/app/services/flight/flight-fetch.service';
import { IFlightSeats } from '@/types/flight';
import { BookingPhase } from '@/types/booking/booking-state';
import { BookingFetchService } from '@/app/services/booking/booking-fetch.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-booking2-seats',
  imports: [
    NgClass,
    SeatsGridComponent,
    HlmToasterComponent,
    HlmButtonDirective,
  ],
  templateUrl: './booking-seats.component.html',
  styleUrls: ['./booking-seats.component.css'],
})
export class BookingSeatsComponent {
  protected SeatClass = SeatClass;

  private _currentFlightIndex: number = 0;
  protected currentFlightSeats!: IFlightSeats;

  protected selectedSeat: string | null = null;

  protected selectedClassInternal:
    | SeatClass.ECONOMY
    | SeatClass.BUSINESS
    | SeatClass.FIRST
    | null = null;
  protected selectedClassGrid:
    | SeatClass.ECONOMY
    | SeatClass.BUSINESS
    | SeatClass.FIRST
    | null = null;

  gridUpdateTimeout: any;

  selectedSeatRow: number = -1;
  selectedSeatCol: number = -1;

  constructor(
    private flightFetchService: FlightFetchService,
    private bookingFetchService: BookingFetchService,
    private bookingStateStore: BookingStateStore,
    private router: Router,
    private loadingService: LoadingService
  ) {
    // Fetch initial seats
    this.fetchFlightSeats().then((seats) => {
      if (!seats) {
        throw new Error('No flight seats found');
      }

      this.currentFlightSeats = seats;
      console.log('currentFlightSeats', this.currentFlightSeats);
    });

    // Create seat session
    this.loadingService.startLoadingTask();
    this.bookingFetchService.createSeatSession().subscribe((session) => {
      this.bookingStateStore.updateBookingState({
        seatSessionId: session.id,
      });
      this.loadingService.endLoadingTask();
      console.log('New session created', session);
    });
  }

  private async fetchFlightSeats() {
    this.loadingService.startLoadingTask();
    const seats = await this.flightFetchService
      .getFlightSeats(this.currentFlight!.id)
      .toPromise();
    this.loadingService.endLoadingTask();
    return seats;
  }

  protected get currentFlight() {
    const state = this.bookingStateStore.getBookingState();

    if (this._currentFlightIndex < state.departureFlights.length) {
      return state.departureFlights[this._currentFlightIndex];
    }

    const newIndex = this._currentFlightIndex - state.departureFlights.length;

    if (state.returnFlights && newIndex < state.returnFlights.length) {
      return state.returnFlights[newIndex];
    }

    return undefined;
  }

  protected toggleSelection(
    newClass: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST
  ): void {
    this.selectedClassInternal =
      this.selectedClassInternal === newClass ? null : newClass;
    this.selectedSeatRow = -1;
    this.selectedSeatCol = -1;
    if (this.gridUpdateTimeout) {
      clearTimeout(this.gridUpdateTimeout);
    }
    this.gridUpdateTimeout = setTimeout(() => {
      this.selectedClassGrid = this.selectedClassInternal;
    }, 200);
  }

  protected onSeatSelection(
    event: {
      row: number;
      col: number;
      class: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST;
    },
    noToast: boolean = false
  ) {
    // If we selected the same seat, then deselect it
    if (
      this.selectedSeatCol === event.col &&
      this.selectedSeatRow == event.row
    ) {
      this.selectedSeatCol = -1;
      this.selectedSeatRow = -1;
      this.selectedSeat = null;
      return;
    }

    // If we selected a different class, then alert the user
    if (this.selectedClassInternal !== event.class) {
      if (this.selectedClassInternal !== null && !noToast) {
        this.showClassChangeToast(
          this.selectedClassInternal,
          this.selectedSeatRow,
          this.selectedSeatCol,
          event.class
        );
      }
      this.toggleSelection(event.class);
    }

    // Actually save the selection
    this.selectedSeatCol = event.col;
    this.selectedSeatRow = event.row;
    this.selectedSeat = this.convertRowColToSeatName(
      event.row,
      event.col,
      this.currentFlightSeats.rows
    );
  }

  protected showClassChangeToast(
    oldClass: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST,
    oldSeatRow: number,
    oldSeatCol: number,
    newClass: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST
  ) {
    toast('You selected a seat from a different class', {
      description:
        'Your class has been changed from ' +
        oldClass +
        ' to ' +
        newClass +
        '.',
      action: {
        label: 'Undo',
        onClick: () =>
          this.onSeatSelection(
            { row: oldSeatRow, col: oldSeatCol, class: oldClass },
            true
          ),
      },
    });
  }

  private convertRowColToSeatName(
    row: number,
    col: number,
    rows: number
  ): string {
    const rowPart = (row + 1).toString();
    const colChar = String.fromCharCode('A'.charCodeAt(0) + col);
    return rowPart + colChar;
  }

  protected async onSeatConfirmation() {
    const state = this.bookingStateStore.getBookingState();

    if (!state.seatSessionId) {
      throw new Error('No seat session id found');
    }

    if (!this.selectedSeat) {
      throw new Error('No seat selected');
    }

    // Add the seat to the session
    this.loadingService.startLoadingTask();
    await firstValueFrom(
      this.bookingFetchService.addSeatToSession(
        state.seatSessionId,
        this.selectedSeat,
        this.currentFlight!.id
      )
    );
    this.loadingService.endLoadingTask();

    // If we have more flights, then fetch and go to the next flight. Otherwise, change page
    this._currentFlightIndex++;
    if (this.currentFlight) {
      this.fetchFlightSeats().then((seats) => {
        if (!seats) {
          throw new Error('No flight seats found');
        }

        this.currentFlightSeats = seats;
        this.selectedSeat = null;
        this.selectedClassInternal = null;
        this.selectedClassGrid = null;
        this.selectedSeatRow = -1;
        this.selectedSeatCol = -1;
      });
    } else {
      this.bookingStateStore.updateBookingState({
        phase: BookingPhase.EXTRAS,
      });
    }
  }
}
