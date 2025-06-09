import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges,} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {SquareComponent} from './square/square.component';
import {SeatClass} from '@/app/pages/airline/aircraft-add/aircraft-add.component';


@Component({
  selector: 'app-seats-grid',
  standalone: true,
  imports: [NgForOf, SquareComponent, NgIf],
  templateUrl: './seats-grid.component.html',
})
export class SeatsGridComponent implements OnChanges {
  /** Number of rows */
  @Input() rows!: number;

  /**
   * Two‐way‐bound matrix of SeatClass.
   * Parent can pass in an initial 2D array, or the grid will initialize it as all UNASSIGNED.
   */
  @Input() seatsMatrix!: SeatClass[][];

  /**
   * Whenever we modify seatsMatrix internally (on click), emit the new full matrix so
   * that parent always has the up‐to‐date structure.
   */
  @Output() seatsMatrixChange = new EventEmitter<SeatClass[][]>();

  /**
   * “Assignment mode”: parent tells us which class to assign on click.
   * If null, clicks do nothing.
   */
  @Input({required: true}) selectedClass: SeatClass = SeatClass.ECONOMY;

  /**
   * Controls whether the grid is interactible or just for display.
   * If false, no clicks are processed and the grid is read-only.
   */ 
  @Input() isInteractible: boolean = true;

  /** Helper array [0,1,2,…,rows−1] for the template */
  protected rowIndices: number[] = [];

  /** Always 6 columns (A–F) in our example */
  protected columnCount = 6;

  ngOnChanges(changes: SimpleChanges): void {
    // 1) If rows changed, rebuild rowIndices. Also, if seatsMatrix is missing or wrong size, initialize it.
    if (changes['rows'] && typeof this.rows === 'number') {
      this.rowIndices = Array(this.rows)
        .fill(0)
        .map((_, i) => i);

      // If parent didn't pass a matrix or its length differs, create a new one full of UNASSIGNED
      if (
        !Array.isArray(this.seatsMatrix) ||
        this.seatsMatrix.length !== this.rows
      ) {
        this.seatsMatrix = Array.from({ length: this.rows }, () =>
          Array(this.columnCount).fill(SeatClass.UNASSIGNED)
        );
        // immediately tell parent that we have created a fresh matrix
        this.seatsMatrixChange.emit(this.seatsMatrix);
      }
    }

    // 2) If parent replaced the matrix entirely (e.g. parent does [seatsMatrix]="…"), we don't need to do anything here,
    //    because Angular will re‐render rows via rowIndices and seatsMatrix[i][j] will reflect the new values.
  }

  /**
   * Called whenever a <app-square> emits a click (row/col).
   * If selectedClass is non‐null, toggle that seat between “that class” and “UNASSIGNED.”
   * Then emit the full updated seatsMatrix back to parent.
   */
  selectedSeat(event: { row: number; col: number }) {
    const { row, col } = event;
    if (this.selectedClass === null || !this.isInteractible) {
      // If parent hasn't chosen a class, we do nothing.
      return;
    }

    // Toggle: if already that class, unassign; otherwise assign
    if (this.seatsMatrix[row][col] === this.selectedClass) {
      this.seatsMatrix[row][col] = SeatClass.UNASSIGNED;
    } else {
      this.seatsMatrix[row][col] = this.selectedClass;
    }

    // Emit the entire updated matrix
    this.seatsMatrixChange.emit(this.seatsMatrix);
  }

  selectRow(row: number) {
    // Selects all seats in the given row, toggling them to the selected class
    if (this.selectedClass === null || !this.isInteractible) {
      return; // If no class is selected, do nothing
    }

    for (let col = 0; col < this.columnCount; col++) {
      this.seatsMatrix[row][col] = this.selectedClass;
    }

    // Emit the updated matrix after toggling the row
    this.seatsMatrixChange.emit(this.seatsMatrix);
  }
}
