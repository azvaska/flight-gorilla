import {Component, Input} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {SeatsGridComponent} from '@/app/components/booking/seats-grid/seats-grid.component';

import { toast } from 'ngx-sonner';
import {HlmToasterComponent} from '@spartan-ng/ui-sonner-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';

@Component({
  selector: 'app-booking2-seats',
  imports: [
    NgClass,
    SeatsGridComponent,
    HlmToasterComponent,
    HlmButtonDirective,
    RouterLink
  ],
  templateUrl: './booking2-seats.component.html',
  styleUrls: ['./booking2-seats.component.css']
})
export class Booking2SeatsComponent {
  selectedClassInternal: string = '';
  selectedClassGrid: string = '';

  gridUpdateTimeout: any;

  selectedSeatRow: number = -1;
  selectedSeatCol: number = -1;

  toggleSelection(newClass: string): void {
    this.selectedClassInternal =
      this.selectedClassInternal === newClass ? '' : newClass;
    this.selectedSeatRow = -1;
    this.selectedSeatCol = -1;
    if(this.gridUpdateTimeout) {
      clearTimeout(this.gridUpdateTimeout);
    }
    this.gridUpdateTimeout = setTimeout(() => {
      this.selectedClassGrid = this.selectedClassInternal;
    }, 200);
  }

  seatSelected(event: {row: number, col: number, class: string}, noToast: boolean = false) {
    if(this.selectedSeatCol === event.col && this.selectedSeatRow == event.row) { // deselect
      this.selectedSeatCol = -1;
      this.selectedSeatRow = -1;
    } else {   // select
      if(this.selectedClassInternal !== event.class) {
        if(this.selectedClassInternal !== '' && !noToast) {
          this.changeClassToast(this.selectedClassInternal, this.selectedSeatRow, this.selectedSeatCol);
        }
        this.toggleSelection(event.class);
      }
      this.selectedSeatCol = event.col;
      this.selectedSeatRow = event.row;
    }
  }

  changeClassToast(oldClass: string, oldSeatRow: number, oldSeatCol: number) {
    toast('You selected a seat from a different class', {
      description: 'Your class has been changed from ' +
        ({"economy": "Economy", "business": "Business", "first":"First Class"})[oldClass] +
        ' to ' +
        ({"economy": "Economy", "business": "Business", "first":"First Class"})[this.selectedClassInternal] + ".",
      action: {
        label: 'Undo',
        onClick: () => this.seatSelected({row: oldSeatRow, col: oldSeatCol, class: oldClass}, true),
      }
    })
  }

  protected readonly onclick = onclick;
}
