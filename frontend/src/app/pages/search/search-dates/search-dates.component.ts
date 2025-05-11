import { Component, Input } from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { PriceCalendarComponent } from './price-calendar/price-calendar.component';
import { Router } from '@angular/router';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { dateToString, formatDate, stringToDate } from '@/utils/date';

@Component({
  selector: 'app-search-dates',
  imports: [
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    PriceCalendarComponent,
    HlmButtonDirective,
  ],
  templateUrl: './search-dates.component.html',
  host: {
    class: 'block w-full h-full',
  },
})
export class SearchDatesComponent {

  @Input() public departureFocusedDate: Date | undefined = undefined;
  @Input() public returnFocusedDate: Date | undefined = undefined;

  protected departureMinDate = new Date();
  protected returnMinDate = new Date();
  protected maxDate = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  );

  protected departureDate: Date | undefined = undefined;
  protected returnDate: Date | undefined = undefined;

  protected departureLoading = false;
  protected returnLoading = false;

  constructor(
    private router: Router,
    private searchParamsGuard: SearchParamsGuard
  ) {
    this.departureFocusedDate = stringToDate(this.searchParamsGuard.params.departure_date);
    this.returnFocusedDate = this.searchParamsGuard.params.return_date ? stringToDate(this.searchParamsGuard.params.return_date) : undefined;
  }

  protected onDepartureDateChange(date: Date | undefined) {
    this.departureDate = date;
    this.returnDate = undefined;
    this.returnMinDate = date ?? new Date();
  }

  protected onReturnDateChange(date: Date | undefined) {
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

  protected onConfirm() {
    if (!this.departureDate) {
      return;
    }

    const departureDate = dateToString(this.departureDate, 'specific');
    const returnDate = this.returnDate ? dateToString(this.returnDate, 'specific') : undefined;

    this.router.navigate(['/search'], {
      queryParams: {
        from_type: this.searchParamsGuard.params.from_type,
        from_id: this.searchParamsGuard.params.from_id,
        to_type: this.searchParamsGuard.params.to_type,
        to_id: this.searchParamsGuard.params.to_id,
        departure_date: departureDate,
        return_date: returnDate,
        date_type: "specific",
      },
    });
  }
}
