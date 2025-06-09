import { Component, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/brain/popover';
import {
  HlmCommandComponent,
  HlmCommandEmptyDirective,
  HlmCommandGroupComponent,
  HlmCommandIconDirective,
  HlmCommandItemComponent,
  HlmCommandListComponent,
  HlmCommandSearchComponent,
  HlmCommandSearchInputComponent,
} from '@spartan-ng/ui-command-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { BrnCommandEmptyDirective } from '@spartan-ng/brain/command';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { NgForOf, NgIf } from '@angular/common';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { IAircraft } from '@/types/airline/aircraft';
import {
  lucideCheck,
  lucideChevronsUpDown,
  lucideSearch,
} from '@ng-icons/lucide';
import { randomInt } from '@/utils/random';
import { SeatsGridComponent } from '@/app/components/airline/seats-grid/seats-grid.component';
import { AnimatedRadioComponent } from '@/app/components/ui/animated-radio/animated-radio.component';
import { AircraftFetchService } from '@/app/services/airline/aircraft-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { firstValueFrom } from 'rxjs';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { Router } from '@angular/router';

export enum SeatClass {
  UNASSIGNED = 'unassigned',
  ECONOMY = 'economy',
  BUSINESS = 'business',
  FIRST = 'first',
  UNAVAILABLE = 'unavailable',
}

@Component({
  selector: 'app-aircraft-add',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BrnPopoverComponent,
    HlmCommandComponent,
    NgIcon,
    HlmCommandListComponent,
    HlmCommandGroupComponent,
    BrnCommandEmptyDirective,
    HlmCommandEmptyDirective,
    HlmCommandSearchInputComponent,
    HlmPopoverContentDirective,
    HlmCommandSearchComponent,
    HlmCommandItemComponent,
    HlmCommandIconDirective,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmButtonDirective,
    NgForOf,
    HlmInputDirective,
    SeatsGridComponent,
    AnimatedRadioComponent,
  ],
  templateUrl: './aircraft-add.component.html',
  providers: [
    provideIcons({ lucideChevronsUpDown, lucideSearch, lucideCheck }),
  ],
  host: {
    class: 'block w-full h-fit',
  },
})
export class AircraftAddComponent {
  protected aircrafts: IAircraft[] = [];

  public selectedAircraftModel = signal<IAircraft | undefined>(undefined);
  public state = signal<'closed' | 'open'>('closed');

  // SEATS GRID
  protected selectedClass:
    | SeatClass.ECONOMY
    | SeatClass.BUSINESS
    | SeatClass.FIRST = SeatClass.ECONOMY;

  seatsMatrix!: SeatClass[][];
  tailNumber: string = '';

  protected isLoading = false;

  constructor(
    private airlineFetchService: AirlineFetchService,
    private aircraftFetchService: AircraftFetchService,
    private loadingService: LoadingService,
    private router: Router
  ) {
    this.fetchAircrafts().then((aircrafts) => {
      this.aircrafts = aircrafts;
      // this.seatsMatrix = this.buildSeatsMatrix(30, this.aircrafts[2].unavailable_seats);
    });
  }

  protected async fetchAircrafts() {
    this.loadingService.startLoadingTask();
    const aircrafts = await firstValueFrom(
      this.aircraftFetchService.getAircrafts()
    );
    this.loadingService.endLoadingTask();
    return aircrafts;
  }

  selectModeChangeHandler(
    newMode: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST
  ) {
    this.selectedClass = newMode;
  }

  buildSeatsMatrix(rows: number, unavailableSeats: string[]): SeatClass[][] {
    const matrix: SeatClass[][] = Array.from({ length: rows }, () =>
      Array(6).fill(SeatClass.UNASSIGNED)
    );
    unavailableSeats.forEach((seat) => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.UNAVAILABLE; // Mark as unavailable
      }
    });
    return matrix;
  }

  assignAllSeats(
    currentSeatClass: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST
  ) {
    for (let row = 0; row < this.seatsMatrix.length; row++) {
      for (let col = 0; col < this.seatsMatrix[row].length; col++) {
        if (this.seatsMatrix[row][col] === SeatClass.UNASSIGNED) {
          this.seatsMatrix[row][col] = currentSeatClass;
        }
      }
    }
  }

  deselectAllSeats() {
    for (let row = 0; row < this.seatsMatrix.length; row++) {
      for (let col = 0; col < this.seatsMatrix[row].length; col++) {
        if (this.seatsMatrix[row][col] !== SeatClass.UNAVAILABLE) {
          this.seatsMatrix[row][col] = SeatClass.UNASSIGNED;
        }
      }
    }
  }

  get nAssignedSeats(): number | undefined {
    if (this.seatsMatrix) {
      return this.seatsMatrix
        .flat()
        .filter(
          (seat) =>
            seat !== SeatClass.UNASSIGNED && seat !== SeatClass.UNAVAILABLE
        ).length;
    }
    return undefined;
  }

  get nTotalSeats(): number | undefined {
    if (this.seatsMatrix) {
      return this.seatsMatrix
        .flat()
        .filter((seat) => seat !== SeatClass.UNAVAILABLE).length;
    }
    return undefined;
  }

  get remainingSeats(): number | undefined {
    if (this.nTotalSeats !== undefined && this.nAssignedSeats !== undefined) {
      return this.nTotalSeats - this.nAssignedSeats;
    }
    return undefined;
  }

  convertSeatNameToRowCol(seatName: string): { row: number; col: number } {
    const row = parseInt(seatName.slice(0, -1), 10) - 1; // Convert seat row to index (1-based to 0-based)
    const col =
      seatName.slice(-1).toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); // Convert column letter to index (A=0, B=1, ...)
    return { row, col };
  }

  convertRowColToSeatName(row: number, col: number): string {
    return `${row + 1}${String.fromCharCode('A'.charCodeAt(0) + col)}`;
  }

  stateChanged(state: 'open' | 'closed') {
    this.state.set(state);
  }

  onAircraftSelection(aircraft: IAircraft) {
    if (this.selectedAircraftModel()?.name === aircraft.name) {
      this.selectedAircraftModel.set(undefined);
      this.seatsMatrix = [];
    } else {
      this.selectedAircraftModel.set(aircraft);
      this.seatsMatrix = this.buildSeatsMatrix(
        aircraft.rows,
        aircraft.unavailable_seats
      );
    }
    this.state.set('closed');
  }

  protected async onSubmit() {
    this.isLoading = true;
    try {
      await firstValueFrom(
        this.airlineFetchService.addAircraft({
          aircraft_id: this.selectedAircraftModel()!.id,
          first_class_seats: this.seatsMatrix.flatMap((row, rowIndex) =>
            row
              .map((seat, colIndex) =>
                seat === SeatClass.FIRST
                  ? this.convertRowColToSeatName(rowIndex, colIndex)
                  : null
              )
              .filter(Boolean)
          ) as string[],
          business_class_seats: this.seatsMatrix.flatMap((row, rowIndex) =>
            row
              .map((seat, colIndex) =>
                seat === SeatClass.BUSINESS
                  ? this.convertRowColToSeatName(rowIndex, colIndex)
                  : null
              )
              .filter(Boolean)
          ) as string[],
          economy_class_seats: this.seatsMatrix.flatMap((row, rowIndex) =>
            row
              .map((seat, colIndex) =>
                seat === SeatClass.ECONOMY
                  ? this.convertRowColToSeatName(rowIndex, colIndex)
                  : null
              )
              .filter(Boolean)
          ) as string[],
          tail_number: this.tailNumber,
        })
      );
      this.router.navigate(['/aircraft']);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  protected readonly SeatClass = SeatClass;
}
