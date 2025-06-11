import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {NgIf} from '@angular/common';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { SearchInputComponent, SearchInputValue } from '@/app/components/ui/search-input/search-input.component';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '@/app/services/loading.service';
import { IAirport } from '@/types/airport';
import { DateInputComponent } from '@/app/components/ui/date-input/date-input.component';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { IRoute } from '@/types/airline/route';
import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

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
    DateInputComponent,
    NgIf,
    HlmToasterComponent,
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
  protected isEditMode = false;
  protected routeId: number | null = null;
  protected existingRoute: IRoute | null = null;
  

  constructor(
    private searchFetchService: SearchFetchService, 
    private loadingService: LoadingService, 
    private airlineFetchService: AirlineFetchService, 
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // Check if we're in edit mode
    this.routeId = Number(this.activatedRoute.snapshot.paramMap.get('routeId'));
    this.isEditMode = !!this.routeId;

    this.initializeComponent();
  }

  private async initializeComponent() {
    // Fetch airports
    const airports = await this.fetchAirports();
    this.airportsList = airports.map((airport) => ({
      value: airport.name,
      data: airport,
    }));

    // If in edit mode, load existing route data
    if (this.isEditMode && this.routeId) {
      await this.loadExistingRoute();
    }
  }

  private async loadExistingRoute() {
    try {
      this.loadingService.startLoadingTask();
      this.existingRoute = await firstValueFrom(
        this.airlineFetchService.getRoute(this.routeId!)
      );
      
      // Set form values
      this.flightNumber = this.existingRoute.flight_number;
      this.periodStart = new Date(this.existingRoute.period_start);
      this.periodEnd = new Date(this.existingRoute.period_end);
      
      // Set airports
      this.departureAirport = {
        value: this.existingRoute.departure_airport.name,
        data: this.existingRoute.departure_airport
      };
      
      this.arrivalAirport = {
        value: this.existingRoute.arrival_airport.name,
        data: this.existingRoute.arrival_airport
      };
      
    } catch (error) {
      console.error('Error loading existing route:', error);
    } finally {
      this.loadingService.endLoadingTask();
    }
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
      const routeData = {
        departure_airport_id: this.departureAirport.data!.id,
        arrival_airport_id: this.arrivalAirport.data!.id,
        period_start: this.periodStart.toISOString(),
        period_end: this.periodEnd.toISOString(),
        flight_number: this.flightNumber
      };

      if (this.isEditMode && this.routeId) {
        // Update existing route
        await firstValueFrom(
          this.airlineFetchService.updateRoute(this.routeId, {
            departure_airport_id: routeData.departure_airport_id.toString(),
            arrival_airport_id: routeData.arrival_airport_id.toString(),
            period_start: routeData.period_start,
            period_end: routeData.period_end,
            flight_number: routeData.flight_number
          })
        );
      } else {
        // Add new route
        await firstValueFrom(this.airlineFetchService.addRoute(routeData));
      }
      
      this.router.navigate(['/routes']);
    } catch (error: any) {
      console.error(this.isEditMode ? "Error updating route" : "Error adding route", error);
      toast('Unknown error', {
        description: `An unexpected error occurred while ${
          this.isEditMode ? 'updating' : 'adding'
        } the route.`,
      });
    } finally {
      this.isLoading = false;
    }
  }
}
