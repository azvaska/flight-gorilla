import { Component, ElementRef, ViewChild } from '@angular/core';
import { SearchInputComponent } from '@/app/components/search-input/search-input.component';
import { DateInputComponent } from '@/app/components/date-input/date-input.component';
@Component({
  selector: 'app-landing-page',
  imports: [SearchInputComponent, DateInputComponent],
  templateUrl: './landing-page.component.html',
  host: {
    class: 'block w-full h-full', // oppure qualsiasi combinazione tu voglia
  },
})
export class LandingPageComponent {
  @ViewChild('firstLocationInput') firstLocationInput!: SearchInputComponent;
  @ViewChild('secondLocationInput') secondLocationInput!: SearchInputComponent;
  @ViewChild('firstDateInput') firstDateInput!: DateInputComponent;
  @ViewChild('secondDateInput') secondDateInput!: DateInputComponent;

  departurePlace: string = '';
  arrivalPlace: string = '';
  departureDate: Date | undefined = undefined;
  returnDate: Date | undefined = undefined;

  onDepartureDateChange(date: Date) {
    this.returnDate = undefined;
  }

  submitFlightSearch() {
    if (this.departurePlace == '') {
      this.firstLocationInput.focus();
      return;
    }

    if (this.arrivalPlace == '') {
      this.secondLocationInput.focus();
      return;
    }

    if (this.departureDate == undefined) {
      this.firstDateInput.focus();
      return;
    }

    if (this.returnDate == undefined) {
      this.secondDateInput.focus();
      return;
    }

    console.log('departurePlace', this.departurePlace);
    console.log('arrivalPlace', this.arrivalPlace);
    console.log('departureDate', this.departureDate);
    console.log('returnDate', this.returnDate);
  }
}
