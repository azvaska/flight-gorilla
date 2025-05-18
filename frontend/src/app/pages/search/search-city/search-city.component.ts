import { Component } from '@angular/core';
import { CityCardComponent } from './components/city-card/city-card.component';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { Router } from '@angular/router';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { ICity } from '@/types/search/location';

@Component({
  selector: 'app-search-city',
  imports: [CityCardComponent],
  templateUrl: './search-city.component.html',
})
export class SearchCityComponent {

  protected cities: ICity[] = []

  constructor(
    private searchParamsGuard: SearchParamsGuard,
    private router: Router,
    private searchFetchService: SearchFetchService
  ) {
    this.searchFetchService.getCitiesByNation(this.searchParamsGuard.params.to_id as string).subscribe((cities) => {
      this.cities = cities;
    });
  }

  handleCitySelection(cityId: string) {
    this.router.navigate(['/search'], {
      queryParams: {
        from_type: this.searchParamsGuard.params.from_type,
        from_id: this.searchParamsGuard.params.from_id,
        to_type: 'city',
        to_id: cityId,
        departure_date: this.searchParamsGuard.params.departure_date,
        return_date: this.searchParamsGuard.params.return_date,
        date_type: this.searchParamsGuard.params.date_type,
      },
    });
  }
}
