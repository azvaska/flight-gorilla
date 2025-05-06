import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {SquareComponent} from '@/app/components/seats-grid/square/square.component';
import {HlmToasterComponent} from '@spartan-ng/ui-sonner-helm';
import {toast} from 'ngx-sonner';

@Component({
  selector: 'app-seats-grid',
  imports: [
    NgForOf,
    SquareComponent,
    NgIf,
    HlmToasterComponent
  ],
  templateUrl: './seats-grid.component.html'
})
export class SeatsGridComponent implements OnInit {
  @Input() rows = 60;

  // by default seats are economy (0)
  @Input() businessSeats: string[] = ["2A", "2B", "2C", "2D", "2E", "2F"]; // 1
  @Input() firstClassSeats: string[] = ["1B", "1E"]; // 2

  @Input() occupiedSeats: string[] = ["8C", "6E"]; // 3
  @Input() unavailableSeats: string[] = ["1A", "1F", "1C", "1D"]; // 4


  @Input() seatsMatrix: number[][] = [];
  @Input() selectedSeatRow: number = -1;
  @Input() selectedSeatCol: number = -1;
  @Input() selectedClass: string = '';

  @Input() selectedOccupiedTitle: string = 'Occupied Seat';
  @Input() selectedOccupiedDescription: string = 'This seat is occupied. Please select another one.';

  private convertSeatNameToRowCol(seatName: string): { row: number, col: number } {
    const colChar = seatName.charAt(seatName.length - 1); // last character is the column letter
    const rowPart = seatName.slice(0, -1); // everything except the last character

    const row = parseInt(rowPart, 10) - 1; // zero-based row
    const col = colChar.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0); // zero-based column

    return { row, col };
  }


  ngOnInit() {
    // initialize the seats matrix with 0s, "rows" rows and 6 columns
    this.seatsMatrix = Array.from({ length: this.rows }, () => Array(6).fill(0));

    // businessSeats
    for (const seat of this.businessSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = 1;
    }

    // firstClassSeats
    for (const seat of this.firstClassSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = 2;
    }

    // occupiedSeats
    for (const seat of this.occupiedSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = 3;
    }

    // unavailableSeats
    for (const seat of this.unavailableSeats) {
      const { row, col } = this.convertSeatNameToRowCol(seat);
      this.seatsMatrix[row][col] = 4;
    }
  }

  selectedSeat(event: {row: number, col: number, class: string}) {
    this.selected.emit(event);
  }

  selectedOccupied(event: {row: number, col: number}) {
    toast(this.selectedOccupiedTitle, {
      description: this.selectedOccupiedDescription,
    })
  }

  @Output() selected = new EventEmitter<{ row: number, col: number, class: string }>();

}
