import {Component, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrnPopoverComponent, BrnPopoverContentDirective, BrnPopoverTriggerDirective} from '@spartan-ng/brain/popover';
import {
  HlmCommandComponent,
  HlmCommandEmptyDirective,
  HlmCommandGroupComponent, HlmCommandIconDirective, HlmCommandItemComponent,
  HlmCommandListComponent, HlmCommandSearchComponent, HlmCommandSearchInputComponent
} from '@spartan-ng/ui-command-helm';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {BrnCommandEmptyDirective} from '@spartan-ng/brain/command';
import {HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {NgForOf, NgIf} from '@angular/common';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {Aircraft} from '@/types/airline/aircraft';
import {lucideCheck, lucideChevronsUpDown, lucideSearch} from '@ng-icons/lucide';
import {randomInt} from '@/utils/random';
import {SeatsGridComponent} from '@/app/pages/airline/aircraft-add/seats-grid/seats-grid.component';
import {AnimatedRadioComponent} from '@/app/components/ui/animated-radio/animated-radio.component';

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
    AnimatedRadioComponent
  ],
  templateUrl: './aircraft-add.component.html',
  providers: [provideIcons({ lucideChevronsUpDown, lucideSearch, lucideCheck })],
  host: {
    class: 'block w-full h-fit',
  },
})

export class AircraftAddComponent {
  aircrafts: Aircraft[] = [
    {
      id: 1,
      name: 'Boeing 737',
      rows: 30,
      unavailableSeats: ['1A', '1B', '2C'],
    },
    {
      id: 2,
      name: 'Airbus A320',
      rows: 32,
      unavailableSeats: ['1A', '1B', '2C', '3D'],
    },
    {
      id: 3,
      name: 'Boeing 777',
      rows: 40,
      unavailableSeats: ['1A', '1B', '2C', '3D', '4E'],
    },
  ];

  public currentModel = signal<Aircraft | undefined>(undefined);
  public state = signal<'closed' | 'open'>('closed');

  // SEATS GRID
  protected selectedClass:
    | SeatClass.ECONOMY
    | SeatClass.BUSINESS
    | SeatClass.FIRST = SeatClass.ECONOMY;
  seatsMatrix!: SeatClass[][];

  selectModeChangeHandler(newMode: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST) {
    this.selectedClass = newMode;
  }

  constructor () {
    for(let i = 0; i < 10; i++){
      const newAircraft: Aircraft = {
        id: i + 4, // Start from 4 since we already have 3 aircrafts
        name: 'Boeing ' + (randomInt(100, 999)), // Random Boeing models
        rows: randomInt(30, 60), // Incrementing rows for variety
        unavailableSeats: [[["1A", "1B", "3F"], ["2C", "2D", "4E"]][randomInt(0, 1)]].flat() // Random unavailable seats
      };
      this.aircrafts = [...this.aircrafts, newAircraft];
    }

    this.seatsMatrix = this.buildSeatsMatrix(30, this.aircrafts[2].unavailableSeats);
  }

  buildSeatsMatrix(rows: number, unavailableSeats: string[]): SeatClass[][] {
    const matrix: SeatClass[][] = Array
      .from({ length: rows }, () => Array(6).fill(SeatClass.UNASSIGNED));
    unavailableSeats.forEach(seat => {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      if (row >= 0 && row < rows && col >= 0 && col < 6) {
        matrix[row][col] = SeatClass.UNAVAILABLE; // Mark as unavailable
      }
    });
    return matrix;
  }

  assignAllSeats(currentSeatClass: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST) {
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

  get nAssignedSeats(): number {
    return this.seatsMatrix.flat().filter(seat => seat !== SeatClass.UNASSIGNED && seat !== SeatClass.UNAVAILABLE).length;
  }

  convertSeatNameToRowCol(seatName: string): { row: number; col: number } {
    const row = parseInt(seatName.slice(0, -1), 10) - 1; // Convert seat row to index (1-based to 0-based)
    const col = seatName.slice(-1).toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); // Convert column letter to index (A=0, B=1, ...)
    return { row, col };
  }
  stateChanged(state: 'open' | 'closed') {
    this.state.set(state);
  }

  commandSelected(aircraft: Aircraft) {
    if (this.currentModel()?.name !== aircraft.name) {
      this.currentModel.set(aircraft);
      this.seatsMatrix = this.buildSeatsMatrix(aircraft.rows, aircraft.unavailableSeats);
    }
    this.state.set('closed');
  }


  protected readonly SeatClass = SeatClass;
}
