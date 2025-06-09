import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
import {SeatClass} from '@/app/pages/airline/aircraft-add/aircraft-add.component';

@Component({
  selector: 'app-square',
  standalone: true,
  imports: [NgClass],
  templateUrl: './square.component.html',
})
export class SquareComponent implements OnChanges {
  /** Which row/column this square represents */
  @Input() row: number = -1;
  @Input() column: number = -1;

  @Input() isInteractible!: boolean;

  /** The seat’s current assignment/status (unassigned, economy, business, first, or unavailable) */
  @Input() status: SeatClass | 'occupied' = SeatClass.UNASSIGNED;

  /** Emits whenever this square is clicked (unless UNAVAILABLE) */
  @Output() selected = new EventEmitter<{ row: number; col: number }>();

  /** Computed Tailwind class for background color / appearance */
  squareStyle = '';

  ngOnChanges(changes: SimpleChanges): void {
    // Whenever status changes, recompute the background class:
    if (changes['status']) {
      this.squareStyle = this.getSquareStyle();
    }
  }

  private getSquareStyle(): string {
    switch (this.status) {
      case SeatClass.UNAVAILABLE:
        // Unavailable seats are “transparent” but not clickable
        return 'bg-transparent pointer-events-none';
      case SeatClass.UNASSIGNED:
        return 'bg-gray-200';
      case SeatClass.ECONOMY:
        return 'bg-green-300';
      case SeatClass.BUSINESS:
        return 'bg-purple-300';
      case SeatClass.FIRST:
        return 'bg-red-300';
      case 'occupied':
        return 'bg-red-700';
      default:
        return '';
    }
  }

  onclick() {
    // Only emit if the seat is not "unavailable"
    if (this.status !== SeatClass.UNAVAILABLE && this.isInteractible) {
      this.selected.emit({ row: this.row, col: this.column });
    }
  }

  protected readonly SeatClass = SeatClass;
}
