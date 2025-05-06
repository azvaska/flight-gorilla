import { Component } from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { PriceCalendarComponent } from './price-calendar/price-calendar.component';

@Component({
  selector: 'app-search-dates',
  imports: [
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    PriceCalendarComponent,
  ],
  templateUrl: './search-dates.component.html',
  host: {
    class: 'block w-full h-full',
  },
})
export class SearchDatesComponent {
  protected departureMinDate = new Date();
  protected returnMinDate = new Date();
  protected maxDate = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  );

  protected departureDate: Date | undefined = undefined;
  protected returnDate: Date | undefined = undefined;

  protected departureLoading = false;
  protected returnLoading = false;

  protected onDepartureDateChange(date: Date) {
    this.departureDate = date;
    this.returnMinDate = date;
    this.returnDate = undefined;
  }

  protected onReturnDateChange(date: Date) {
    this.returnDate = date;
  }

  protected onDepartureMonthChange(month: number, year: number) {
    // TODO: Placehodler
    this.departureLoading = true;
    setTimeout(() => {
      this.departureLoading = false;
    }, 2000);
  }

  protected onReturnMonthChange(month: number, year: number) {
    // TODO: Placehodler
    this.returnLoading = true;
    setTimeout(() => {
      this.returnLoading = false;
    }, 2000);
  }
}
