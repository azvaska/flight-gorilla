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
import { IJourney } from '@/types/search/journey';
import { forkJoin, of } from 'rxjs';
import { FlightFetchService } from '@/app/services/flight/flight-fetch.service';
import { LoadingService } from '@/app/services/loading.service';

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
    private bookingStore: BookingStateStore,
    private flightFetchService: FlightFetchService,
    private loadingService: LoadingService
  ) {

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const child = this.route.firstChild?.snapshot;
        this.selectedNumber = child?.data?.['selectedNumber'] || 1;
      });

      
      const state = this.router.getCurrentNavigation()?.extras.state as {
        departureJourney: IJourney;
        returnJourney?: IJourney;
      };
      
      if (!state) {
        this.router.navigate(['/'], { replaceUrl: true });
        return;
      }
      
    this.loadingService.startLoadingTask();
    forkJoin({
      departureFlights: forkJoin(
        state.departureJourney.segments.map((segment) =>
          this.flightFetchService.getFlight(segment.id)
        )
      ),
      returnFlights: state.returnJourney
        ? forkJoin(
            state.returnJourney.segments.map((segment) =>
              this.flightFetchService.getFlight(segment.id)
            )
          )
        : of([]),
    }).subscribe(({ departureFlights, returnFlights }) => {
      this.bookingStore.setBookingState({
        departureFlights,
        returnFlights,
        phase: BookingPhase.OVERVIEW,
      });

      console.log('booking state', this.bookingStore.getBookingState());
      this.loadingService.endLoadingTask();
    });

    this.bookingStore.getBookingStateObservable().subscribe((state) => {
      if (!state) {
        return;
      }

      const phase = state.phase;
      switch (phase) {
        case BookingPhase.OVERVIEW:
          this.router.navigate(['/booking/overview']);
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
