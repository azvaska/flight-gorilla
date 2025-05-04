import { Component } from '@angular/core';
import { SearchInputComponent } from '@/app/components/search-input/search-input.component';
import { DateInputComponent } from '@/app/components/date-input/date-input.component';
import { RouterModule, Router } from '@angular/router';
import { FlightSearchBarComponent } from '@/app/components/flight-search/search-bar/search-bar.component';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
@Component({
  selector: 'app-landing-page',
  imports: [RouterModule, SearchInputComponent, DateInputComponent, FlightSearchBarComponent, HlmCardDirective, HlmCardContentDirective, HlmCardHeaderDirective, HlmCardTitleDirective, HlmCardDescriptionDirective, HlmCardFooterDirective],
  templateUrl: './landing-page.component.html',
  host: {
    class: 'block w-full h-full', // oppure qualsiasi combinazione tu voglia
  },
  standalone: true,
})
export class LandingPageComponent {
  public departurePlace: string | undefined = undefined;
  public arrivalPlace: string | undefined = undefined;
  public departureDate: Date | undefined = undefined;
  public returnDate: Date | undefined = undefined;

  constructor(private router: Router) {}

  public submitFlightSearch() {

    // TODO: Mock logic.
    const from_type = "city"
    const to_type = "country"

    this.router.navigate(['/search'], {
      queryParams: {
        from_type: from_type,
        to_type: to_type,
        from_id: this.departurePlace,
        to_id: this.arrivalPlace,
        departure_date: this.departureDate?.toISOString(),
        return_date: this.returnDate?.toISOString(),
        date_type: "specific",
      },
    });
  }
}
