import {Component, Input} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'booking-cancelled',
  imports: [],
  templateUrl: './booking-cancelled.component.html'
})
export class BookingCancelledComponent {
  protected reimbursement: boolean;

  constructor(private route: ActivatedRoute) {
    this.reimbursement = this.route.snapshot.queryParams['reimbursement'] === 'true';
  }
}
