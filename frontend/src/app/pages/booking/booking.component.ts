import { Component } from '@angular/core';
import { ProgressWidgetComponent } from '@/app/components/booking/progress-widget/progress-widget.component';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { BookingStateStore } from '@/app/stores/booking-state.store';
import { BookingPhase, IBookingState } from '@/types/booking/booking-state';

@Component({
  selector: 'app-booking',
  imports: [ProgressWidgetComponent, RouterOutlet],
  templateUrl: './booking.component.html',
  host: {
    class: 'block w-full h-full',
  },
  providers: [BookingStateStore],
})
export class BookingComponent {
  selectedNumber = 1;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bookingStore: BookingStateStore
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const child = this.route.firstChild?.snapshot;
        this.selectedNumber = child?.data?.['selectedNumber'] || 1;
      });

    const state = this.router.getCurrentNavigation()?.extras.state;
    console.log('state from booking', state);
    if (!state) {
      this.router.navigate(['/'], { replaceUrl: true });
      return;
    }


    this.bookingStore.setBookingState({
      ...(state as IBookingState),
      phase: BookingPhase.OVERVIEW,
    });

    this.bookingStore.getBookingStateObservable().subscribe((state) => {
      if (!state) {
        this.router.navigate(['/not-found'], { replaceUrl: true });
        return;
      }

      const phase = state.phase;
      switch (phase) {
        case BookingPhase.OVERVIEW:
          this.router.navigate(['/booking/overview'], { replaceUrl: true });
          break;
        case BookingPhase.SEATS:
          this.router.navigate(['/booking/seats'], { replaceUrl: true });
          break;
        case BookingPhase.EXTRAS:
          this.router.navigate(['/booking/extras'], { replaceUrl: true });
          break;
        case BookingPhase.PAYMENT:
          this.router.navigate(['/booking/payment'], { replaceUrl: true });
          break;
      }
    });
  }
}
