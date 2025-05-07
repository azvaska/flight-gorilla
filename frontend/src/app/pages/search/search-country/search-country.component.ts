import { Component } from '@angular/core';
import { CountryCardComponent } from './components/country-card/country-card.component';
import { Router } from '@angular/router';
import { SearchParamsGuard } from '@/app/guards/search-guard';

@Component({
  selector: 'app-search-country',
  imports: [CountryCardComponent],
  templateUrl: './search-country.component.html',
})
export class SearchCountryComponent {
  constructor(
    private searchParamsGuard: SearchParamsGuard,
    private router: Router
  ) {}

  handleCountrySelection(countryId: string) {
    this.router.navigate(['/search'], {
      queryParams: {
        from_type: this.searchParamsGuard.params.from_type,
        from_id: this.searchParamsGuard.params.from_id,
        to_type: 'country',
        to_id: countryId,
        departure_date: this.searchParamsGuard.params.departure_date,
        return_date: this.searchParamsGuard.params.return_date,
        date_type: this.searchParamsGuard.params.date_type,
      },
    });
  }
}
