import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { PopoverComponent } from '@/app/components/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/popover/popover-trigger.directive';
import { FlightSearchBarComponent } from '@/app/components/flight-search/search-bar/search-bar.component';
import { parseFlightSearchParams } from '@/utils/parsers/flight-search.parse';

enum SearchStatus {
  COUNTRY = 'country',
  CITY = 'city',
  DATES = 'dates',
  FLIGHTS = 'flights',
}

interface SearchOverview {
  from_type: 'city' | 'airport';
  from_id?: string | undefined;
  to_type: 'country' | 'city' | 'airport' | 'anywhere';
  to_id?: string | undefined;
  departure_date: string;
  return_date: string;
  date_type: 'flexible' | 'specific';
}

@Component({
  selector: 'search',
  imports: [
    RouterModule,
    HlmCardDirective,
    PopoverComponent,
    PopoverTriggerDirective,
    FlightSearchBarComponent,
  ],
  templateUrl: './search.component.html',
  host: {
    class: 'block w-full h-full',
  },
})
export class SearchComponent {
  public searchOverview!: SearchOverview;

  searchStatus: SearchStatus | undefined = undefined;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const params = this.route.queryParams.subscribe((params) => {
      console.log("sus", params);
      const fromType = params['from_type'];
      const fromId = params['from_id'];
      const toType = params['to_type'];
      const toId = params['to_id'];
      const departureDate = params['departure_date'];
      const returnDate = params['return_date'];
      const dateType = params['date_type'];
      
      try {
        this.searchOverview = parseFlightSearchParams({
          from_type: fromType,
          from_id: fromId,
          to_type: toType,
          to_id: toId,
          departure_date: departureDate,
          return_date: returnDate,
          date_type: dateType,
        });
        console.log(this.searchOverview);
      } catch (error) {
        console.log(error);
        this.router.navigate(['/404']);
      }

      if (this.isAnywhereSearch()) {
        this.searchStatus = SearchStatus.COUNTRY;
        this.router.navigate(['/search/country'], {
          queryParamsHandling: 'preserve',
        });
      } else if (this.isCountrySearch()) {
        this.searchStatus = SearchStatus.CITY;
        this.router.navigate(['/search/city'], {
          queryParamsHandling: 'preserve',
        });
      }
      else if (this.isFlexibleDatesSearch()) {
        this.router.navigate(['/search/dates'], {
          queryParamsHandling: 'preserve',
        });
        this.searchStatus = SearchStatus.DATES;
      } else {
        this.router.navigate(['/search/flights'], {
          queryParamsHandling: 'preserve',
        });
        this.searchStatus = SearchStatus.FLIGHTS;
      }
    });
  }

  isAnywhereSearch() {
    return this.searchOverview.to_type === 'anywhere';
  }

  isCountrySearch() {
    return this.searchOverview.to_type === 'country';
  }

  isFlexibleDatesSearch() {
    return this.searchOverview.date_type === 'flexible';
  }
}
