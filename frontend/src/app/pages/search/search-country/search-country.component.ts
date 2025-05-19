import { Component } from '@angular/core';
import { CountryCardComponent } from './components/country-card/country-card.component';
import { Router } from '@angular/router';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { INation } from '@/types/search/location';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';

@Component({
  selector: 'app-search-country',
  imports: [CountryCardComponent],
  templateUrl: './search-country.component.html',
})
export class SearchCountryComponent {

  protected nations: INation[] = []

  constructor(
    private searchParamsGuard: SearchParamsGuard,
    private router: Router,
    private searchFetchService: SearchFetchService
  ) {
    this.searchFetchService.getNations().subscribe((nations) => {
      this.nations = nations;
    });
  }

  handleCountrySelection(countryId: string) {
    this.router.navigate(['/search'], {
      queryParams: {
        from_type: this.searchParamsGuard.params.from_type,
        from_id: this.searchParamsGuard.params.from_id,
        to_type: 'nation',
        to_id: countryId,
        departure_date: this.searchParamsGuard.params.departure_date,
        return_date: this.searchParamsGuard.params.return_date,
        date_type: this.searchParamsGuard.params.date_type,
      },
    });
  }
}
