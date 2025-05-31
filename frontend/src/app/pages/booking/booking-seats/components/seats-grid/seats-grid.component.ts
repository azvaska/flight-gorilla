import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { SquareComponent } from '@/app/pages/booking/booking-seats/components/seats-grid/square/square.component';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { toast } from 'ngx-sonner';

export enum SeatClass {
  ECONOMY = 'economy',
  BUSINESS = 'business',
  FIRST = 'first',
  OCCUPIED = 'occupied',
  UNAVAILABLE = 'unavailable',
}
@Component({
  selector: 'app-seats-grid',
  imports: [NgForOf, SquareComponent, NgIf, HlmToasterComponent, NgClass],
  templateUrl: './seats-grid.component.html',
})
export class SeatsGridComponent implements OnChanges {
  @Input() rows!: number;

  @Input() economyClassSeats: string[] = [];
  @Input() businessClassSeats: string[] = [];
  @Input() firstClassSeats: string[] = [];

  @Input() occupiedSeats: string[] = [];

  @Input() selectedSeatRow: number = -1;
  @Input() selectedSeatCol: number = -1;

  @Input() selectedClass:
    | SeatClass.ECONOMY
    | SeatClass.BUSINESS
    | SeatClass.FIRST
    | null = null;

  @Input() selectedOccupiedTitle: string = 'Occupied Seat';
  @Input() selectedOccupiedDescription: string =
    'This seat is occupied. Please select another one.';

  protected seatsMatrix: SeatClass[][] = [];

  protected rowIndices: number[] = [];
  protected columnIndices: number[] = Array(6)
    .fill(0)
    .map((_, i) => i);
  protected trackByRow = (index: number, row: number) => row;
  protected trackByColumn = (index: number, column: number) => column;

  SeatClass = SeatClass;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows'] && typeof changes['rows'].currentValue === 'number') {
      this.rowIndices = Array(changes['rows'].currentValue)
        .fill(0)
        .map((_, i) => i);
    }

    // Handle change of selectedClass
    if (
      changes['economyClassSeats'] ||
      changes['businessClassSeats'] ||
      changes['firstClassSeats'] ||
      changes['occupiedSeats']
    ) {
      this.initializeSeatsMatrix();
    }
  }

  private initializeSeatsMatrix() {
    // initialize the seats matrix with 0s, "rows" rows and 6 columns
    this.seatsMatrix = Array.from({ length: this.rows }, () =>
      Array(6).fill(SeatClass.UNAVAILABLE)
    );

    // economyClassSeats
    for (const seat of this.economyClassSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = SeatClass.ECONOMY;
    }

    // businessSeats
    for (const seat of this.businessClassSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = SeatClass.BUSINESS;
    }

    // firstClassSeats
    for (const seat of this.firstClassSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = SeatClass.FIRST;
    }

    // occupiedSeats
    for (const seat of this.occupiedSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = SeatClass.OCCUPIED;
    }
  }

  private convertSeatNameToRowCol(seatName: string): {
    row: number;
    col: number;
  } {
    const colChar = seatName.charAt(seatName.length - 1); // last character is the column letter
    const rowPart = seatName.slice(0, -1); // everything except the last character

    const row = parseInt(rowPart, 10) - 1; // zero-based row
    const col = colChar.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); // zero-based column

    return { row, col };
  }

  selectedSeat(event: {
    row: number;
    col: number;
    class: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST;
  }) {
    this.selected.emit(event);
  }

  selectedOccupied(event: { row: number; col: number }) {
    toast(this.selectedOccupiedTitle, {
      description: this.selectedOccupiedDescription,
    });
  }

  @Output() selected = new EventEmitter<{
    row: number;
    col: number;
    class: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST;
  }>();
}
