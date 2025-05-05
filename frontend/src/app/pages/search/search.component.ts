import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { PopoverComponent } from '@/app/components/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/popover/popover-trigger.directive';
import { FlightSearchBarComponent } from '@/app/components/flight-search/search-bar/search-bar.component';
import { parseGenericFlightSearchParams } from '@/utils/parsers/flight-search.parse';

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

}
