import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {NgIf} from '@angular/common';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {Router, RouterLink} from '@angular/router';
import { SearchInputComponent, SearchInputValue } from '@/app/components/ui/search-input/search-input.component';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '@/app/services/loading.service';
import { IAirport } from '@/types/airport';
import { DateInputComponent } from '@/app/components/ui/date-input/date-input.component';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
@Component({
  selector: 'app-route-add',
  imports: [
    FormsModule,
    HlmInputDirective,
    HlmLabelDirective,
    ReactiveFormsModule,
    HlmButtonDirective,
    SearchInputComponent,
    HlmCardDirective,
    DateInputComponent
  ],
  templateUrl: './route-add.component.html',
  host: {
    class: 'w-full h-fit'
  }
})
export class RouteAddComponent {
  protected airportsList: SearchInputValue<IAirport>[] = [];

  protected departureAirport: SearchInputValue<IAirport> | undefined = undefined;
  protected arrivalAirport: SearchInputValue<IAirport> | undefined = undefined;
  protected periodStart: Date | undefined = undefined;
  protected periodEnd: Date | undefined = undefined;

  protected flightNumber: string = '';

  protected isLoading: boolean = false;
  

  constructor(private searchFetchService: SearchFetchService, private loadingService: LoadingService, private airlineFetchService: AirlineFetchService, private router: Router) {
    this.fetchAirports().then((airports) => {
      this.airportsList = airports.map((airport) => ({
        value: airport.name,
        data: airport,
      }));
    });
  }


  private async fetchAirports() {
    this.loadingService.startLoadingTask();
    const airports = await firstValueFrom(this.searchFetchService.getAirports());
    this.loadingService.endLoadingTask();
    return airports;
  }

  protected async onSubmit() {
    this.isLoading = true;

    if(!this.departureAirport || !this.arrivalAirport || !this.periodStart || !this.periodEnd || !this.flightNumber) {
      return;
    }

    try{
      await firstValueFrom(this.airlineFetchService.addRoute({
        departure_airport_id: this.departureAirport.data!.id,
        arrival_airport_id: this.arrivalAirport.data!.id,
        period_start: this.periodStart.toISOString(),
        period_end: this.periodEnd.toISOString(),
        flight_number: this.flightNumber
      }));
      this.router.navigate(['/routes']);
    } catch (error) {
      console.error("Error adding route", error);
    } finally {
      this.isLoading = false;
    }
  }

}
