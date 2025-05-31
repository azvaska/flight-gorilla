import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-cancel-reservation',
  imports: [],
  templateUrl: './cancel-reservation.component.html'
})
export class CancelReservationComponent {
  @Input() reimbursement: boolean = true;
}
