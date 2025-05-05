import { Component } from '@angular/core';
import { CountryCardComponent } from './components/country-card/country-card.component';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search-country',
  imports: [CountryCardComponent],
  templateUrl: './search-country.component.html',
})
export class SearchCountryComponent {
  departurePlace = '';
  arrivalPlace: string = '';
  departureDate: string = '';
  returnDate: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const params = this.route.queryParams.subscribe((params) => {
      this.departurePlace = params['departurePlace'];
      this.arrivalPlace = params['arrivalPlace'];
      this.departureDate = params['departureDate'];
      this.returnDate = params['returnDate'];

      if (
        this.departurePlace == '' ||
        this.arrivalPlace == '' ||
        this.departureDate == '' ||
        this.returnDate == ''
      ) {
        this.router.navigate(['/404']);
      }
    });
  }

  handleCountrySelection(countryId: string) {
    this.router.navigate(['/search/city'], {
      queryParams: {
        departurePlace: this.departurePlace,
        arrivalPlace: this.arrivalPlace,
        departureDate: this.departureDate,
        returnDate: this.returnDate,
        countryId: countryId,
      },
    });
  }
}
