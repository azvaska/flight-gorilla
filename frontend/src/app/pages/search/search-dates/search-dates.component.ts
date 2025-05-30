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
import { SearchFetchService } from '@/app/services/search/search-fetch.service';

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
  protected departureFocusedDate: Date;
  protected returnFocusedDate: Date | undefined = undefined;

  protected departureMinDate = new Date();
  protected returnMinDate = new Date();
  protected maxDate = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  );

  protected departureDate: Date | undefined = undefined;
  protected returnDate: Date | undefined = undefined;

  protected departureLoading = false;
  protected returnLoading = false;

  protected departurePrices: (number | null)[] = [];
  protected returnPrices: (number | null)[] = [];

  constructor(
    private router: Router,
    private searchParamsGuard: SearchParamsGuard,
    private searchFetchService: SearchFetchService
  ) {
    this.departureFocusedDate = stringToDate(
      this.searchParamsGuard.params.departure_date
    );
    this.returnFocusedDate = this.searchParamsGuard.params.return_date
      ? stringToDate(this.searchParamsGuard.params.return_date)
      : undefined;

    this.onDepartureMonthChange(
      this.departureFocusedDate.getMonth() + 1,
      this.departureFocusedDate.getFullYear()
    );

    if (this.returnFocusedDate) {
      this.onReturnMonthChange(
        this.returnFocusedDate.getMonth() + 1,
        this.returnFocusedDate.getFullYear()
      );
    }
  }

  protected onDepartureDateChange(date: Date | undefined) {
    console.log('departure date', date);
    this.departureDate = date;
    this.returnDate = undefined;
    this.returnMinDate = date ?? new Date();
    console.log('return min date', this.returnMinDate);
  }

  protected onReturnDateChange(date: Date | undefined) {
    this.returnDate = date;
  }

  protected onDepartureMonthChange(month: number, year: number) {
    this.departureLoading = true;

    this.searchFetchService
      .getFlexibleDates({
        departureId: this.searchParamsGuard.params.from_id,
        departureType: this.searchParamsGuard.params.from_type,
        arrivalId: this.searchParamsGuard.params.to_id as string,
        arrivalType: this.searchParamsGuard.params.to_type as
          | 'city'
          | 'airport',
        departureDate: `${month.toString().padStart(2, '0')}-${year}`,
      })
      .subscribe((prices) => {
        this.departurePrices = prices;
        this.departureLoading = false;
      });
  }

  protected onReturnMonthChange(month: number, year: number) {
    this.returnLoading = true;

    this.searchFetchService
      .getFlexibleDates({
        departureId: this.searchParamsGuard.params.to_id as string,
        departureType: this.searchParamsGuard.params.to_type as 'city' | 'airport',
        arrivalId: this.searchParamsGuard.params.from_id,
        arrivalType: this.searchParamsGuard.params.from_type as 'city' | 'airport',
        departureDate: `${month.toString().padStart(2, '0')}-${year}`,
      })
      .subscribe((prices) => {
        this.returnPrices = prices;
        this.returnLoading = false;
      });
  }

  protected onConfirm() {
    if (!this.departureDate) {
      return;
    }

    const departureDate = dateToString(this.departureDate, 'specific');
    const returnDate = this.returnDate
      ? dateToString(this.returnDate, 'specific')
      : undefined;

    this.router.navigate(['/search'], {
      queryParams: {
        from_type: this.searchParamsGuard.params.from_type,
        from_id: this.searchParamsGuard.params.from_id,
        to_type: this.searchParamsGuard.params.to_type,
        to_id: this.searchParamsGuard.params.to_id,
        departure_date: departureDate,
        return_date: returnDate,
        date_type: 'specific',
      },
    });
  }
}
