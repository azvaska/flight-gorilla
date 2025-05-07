import { Component } from '@angular/core';
import { CityCardComponent } from './components/city-card/city-card.component';
import { SearchParamsGuard } from '@/app/guards/search-guard';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-city',
  imports: [CityCardComponent],
  templateUrl: './search-city.component.html',
})
export class SearchCityComponent {
  constructor(
    private searchParamsGuard: SearchParamsGuard,
    private router: Router
  ) {}

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
