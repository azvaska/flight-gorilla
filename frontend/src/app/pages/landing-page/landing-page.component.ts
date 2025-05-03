import { Component } from '@angular/core';
import { FlightSearchInputComponent } from '@/app/components/flight-search/flight-search-input/flight-search-input.component';
@Component({
  selector: 'app-landing-page',
  imports: [FlightSearchInputComponent],
  templateUrl: './landing-page.component.html',
  host: {
    class: 'block w-full h-full', // oppure qualsiasi combinazione tu voglia
  },
})
export class LandingPageComponent {}
