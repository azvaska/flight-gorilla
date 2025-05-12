import { Component } from '@angular/core';
import {ProgressWidgetComponent} from '@/app/components/booking/progress-widget/progress-widget.component';
import {Booking1OverviewComponent} from '@/app/pages/booking/booking1-overview/booking1-overview.component';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import { filter } from 'rxjs/operators';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-booking',
  imports: [
    ProgressWidgetComponent,
    RouterOutlet
  ],
  templateUrl: './booking.component.html',
  host: {
    class: 'block w-full h-full',
  },
})

export class BookingComponent {
  selectedNumber = 1;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const child = this.route.firstChild?.snapshot;
      this.selectedNumber = child?.data?.['selectedNumber'] || 1;
    });
  }
}
