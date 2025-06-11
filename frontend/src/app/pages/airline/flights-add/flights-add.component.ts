import { Component, signal, OnInit } from '@angular/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/brain/popover';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import {
  HlmCommandComponent,
  HlmCommandEmptyDirective,
  HlmCommandGroupComponent,
  HlmCommandIconDirective,
  HlmCommandItemComponent,
  HlmCommandListComponent,
  HlmCommandSearchComponent,
  HlmCommandSearchInputComponent,
} from '@spartan-ng/ui-command-helm';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronsUpDown,
  lucideSearch,
  lucideEllipsis,
} from '@ng-icons/lucide';
import { BrnCommandEmptyDirective } from '@spartan-ng/brain/command';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { dateToString, formatTime } from '@/utils/date';
import { FormsModule } from '@angular/forms';
import { DateInputComponent } from '@/app/components/ui/date-input/date-input.component';
import {
  SearchInputComponent,
  SearchInputValue,
} from '@/app/components/ui/search-input/search-input.component';
import { AirlineFetchService } from '@/app/services/airline/airline-fetch.service';
import { LoadingService } from '@/app/services/loading.service';
import { IRoute } from '@/types/airline/route';
import { IExtra } from '@/types/airline/extra';
import { IAirlineAircraft } from '@/types/airline/aircraft';
import { firstValueFrom } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';
import {
  HlmTableComponent,
  HlmTrowComponent,
  HlmThComponent,
} from '@spartan-ng/ui-table-helm';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/brain/alert-dialog';
import {
  HlmAlertDialogActionButtonDirective,
  HlmAlertDialogCancelButtonDirective,
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
import { IAirlineFlight } from '@/types/airline/flight';
import { FlightFetchService } from '@/app/services/flight/flight-fetch.service';

interface FlightExtra {
  id: string;
  name: string;
  description: string;
  price: number;
  limit: number;
  stackable: boolean;
  extra_id?: string;
}

@Component({
  selector: 'app-flights-add',
  imports: [
    HlmInputDirective,
    HlmLabelDirective,
    HlmButtonDirective,
    BrnPopoverComponent,
    BrnPopoverTriggerDirective,
    BrnPopoverContentDirective,
    HlmPopoverContentDirective,
    HlmCommandComponent,
    NgIcon,
    HlmCommandSearchComponent,
    HlmCommandListComponent,
    HlmCommandGroupComponent,
    HlmCommandItemComponent,
    HlmCommandIconDirective,
    BrnCommandEmptyDirective,
    HlmCommandEmptyDirective,
    HlmCommandSearchInputComponent,
    NgForOf,
    NgClass,
    FormsModule,
    DateInputComponent,
    HlmCardDirective,
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    PopoverComponent,
    PopoverTriggerDirective,
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogTitleDirective,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogActionButtonDirective,
    HlmSpinnerComponent,
    BrnAlertDialogContentDirective,
    BrnAlertDialogTriggerDirective,
    HlmAlertDialogCancelButtonDirective,
  ],
  providers: [
    provideIcons({
      lucideChevronsUpDown,
      lucideSearch,
      lucideCheck,
      lucideEllipsis,
    }),
  ],
  templateUrl: './flights-add.component.html',
})
export class FlightsAddComponent implements OnInit {
  // Data from API
  routes: IRoute[] = [];
  availableExtras: IExtra[] = [];
  unavailableExtras: IExtra[] = [];
  aircrafts: IAirlineAircraft[] = [];

  // Selected flight extras
  flightExtras: FlightExtra[] = [];

  // Route popover
  public currentRoute = signal<IRoute | undefined>(undefined);
  public state1 = signal<'closed' | 'open'>('closed');

  // Aircraft popover
  public currentAircraft = signal<IAirlineAircraft | undefined>(undefined);
  public stateAircraft = signal<'closed' | 'open'>('closed');

  // Extra popover
  public currentExtra = signal<IExtra | undefined>(undefined);
  public state2 = signal<'closed' | 'open'>('closed');

  // Flight form data
  protected flightDate: Date | undefined = undefined;
  protected departureTime: string = '';
  protected flightDurationMinutes: number = 0;
  protected checkinStartTime: string = '';
  protected checkinEndTime: string = '';
  protected boardingStartTime: string = '';
  protected boardingEndTime: string = '';
  protected gate: string = '';
  protected terminal: string = '';
  protected priceFirstClass: number = 0;
  protected priceBusinessClass: number = 0;
  protected priceEconomyClass: number = 0;
  protected priceInsurance: number = 0;

  // extras Popup
  protected extrasDetail: 'new' | number | null = null;
  protected extraPrice = 0;
  protected extraLimit = 1;

  // page switcher (forms-extras)
  protected page: 'forms' | 'extras' = 'forms';

  // Loading states
  protected isLoading = false;
  protected isSaving = false;
  protected isDeleteExtraLoading = false;

  // Edit mode
  protected isEditMode = false;
  protected flightId: string | null = null;
  protected existingFlight: IAirlineFlight | null = null;

  // Date helper
  protected readonly today = new Date();

  constructor(
    private airlineFetchService: AirlineFetchService,
    private flightFetchService: FlightFetchService,
    private loadingService: LoadingService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // Check if we're in edit mode
    this.flightId = this.activatedRoute.snapshot.paramMap.get('flightId');
    this.isEditMode = !!this.flightId;
  }

  async ngOnInit() {
    await this.loadData();

    // If in edit mode, load existing flight data
    if (this.isEditMode && this.flightId) {
      await this.loadExistingFlight();
    }
  }

  private async loadData() {
    try {
      this.loadingService.startLoadingTask();

      const [routes, extras, aircrafts] = await Promise.all([
        firstValueFrom(this.airlineFetchService.getRoutes()),
        firstValueFrom(this.airlineFetchService.getExtras()),
        firstValueFrom(this.airlineFetchService.getAircrafts()),
      ]);

      this.routes = routes;
      this.availableExtras = extras;
      this.aircrafts = aircrafts;
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
    } finally {
      this.loadingService.endLoadingTask();
    }
  }

  private async loadExistingFlight() {
    try {
      this.loadingService.startLoadingTask();

      const [flight, flightExtras] = await Promise.all([
        firstValueFrom(this.airlineFetchService.getFlight(this.flightId!)),
        firstValueFrom(this.flightFetchService.getFlightExtras(this.flightId!)),
      ]);
      this.existingFlight = flight;
      this.flightExtras = flightExtras;
      this.unavailableExtras = this.availableExtras.filter(extra => flightExtras.some(fe => fe.extra_id === extra.id));
      this.availableExtras = this.availableExtras.filter(extra => !this.unavailableExtras.some(ue => ue.id === extra.id));

      // Set route
      const route = this.routes.find(r => r.id.toString() === this.existingFlight!.route_id.toString());
      if (route) {
        this.currentRoute.set(route);
      }

      // Set aircraft
      const aircraft = this.aircrafts.find(a => a.id.toString() === this.existingFlight!.aircraft.id.toString());
      if (aircraft) {
        this.currentAircraft.set(aircraft);
      }

      // Set form values
      this.flightDate = new Date(this.existingFlight.departure_time);
      this.departureTime = this.formatTimeForInput(this.existingFlight.departure_time);

      // Calculate duration
      const depTime = new Date(this.existingFlight.departure_time);
      const arrTime = new Date(this.existingFlight.arrival_time);
      this.flightDurationMinutes = Math.round((arrTime.getTime() - depTime.getTime()) / (1000 * 60));

      // Set prices
      this.priceFirstClass = this.existingFlight.price_first_class;
      this.priceBusinessClass = this.existingFlight.price_business_class;
      this.priceEconomyClass = this.existingFlight.price_economy_class;
      this.priceInsurance = this.existingFlight.price_insurance;

      // Set optional fields if they exist
      if (this.existingFlight.gate) this.gate = this.existingFlight.gate;
      if (this.existingFlight.terminal) this.terminal = this.existingFlight.terminal;
      if (this.existingFlight.checkin_start_time) {
        this.checkinStartTime = this.formatTimeForInput(this.existingFlight.checkin_start_time);
      }
      if (this.existingFlight.checkin_end_time) {
        this.checkinEndTime = this.formatTimeForInput(this.existingFlight.checkin_end_time);
      }
      if (this.existingFlight.boarding_start_time) {
        this.boardingStartTime = this.formatTimeForInput(this.existingFlight.boarding_start_time);
      }
      if (this.existingFlight.boarding_end_time) {
        this.boardingEndTime = this.formatTimeForInput(this.existingFlight.boarding_end_time);
      }

    } catch (error) {
      console.error('Error loading existing flight:', error);
    } finally {
      this.loadingService.endLoadingTask();
    }
  }

  private formatTimeForInput(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toTimeString().slice(0, 5); // HH:MM format
  }

  // Route selection methods
  state1Changed(state: 'open' | 'closed') {
    this.state1.set(state);
  }

  command1Selected(route: IRoute) {
    if (this.currentRoute()?.id !== route.id) {
      this.currentRoute.set(route);
    }
    this.state1.set('closed');
  }

  // Aircraft selection methods
  stateAircraftChanged(state: 'open' | 'closed') {
    this.stateAircraft.set(state);
  }

  commandAircraftSelected(aircraft: IAirlineAircraft) {
    if (this.currentAircraft()?.id !== aircraft.id) {
      this.currentAircraft.set(aircraft);
    }
    this.stateAircraft.set('closed');
  }

  // Extra selection methods
  state2Changed(state: 'open' | 'closed') {
    this.state2.set(state);
  }

  command2Selected(extra: IExtra) {
    if (this.currentExtra()?.id !== extra.id) {
      this.currentExtra.set(extra);
    }
    this.state2.set('closed');
  }

  get showForms() {
    return this.page === 'forms' && this.currentRoute();
  }

  get showExtras() {
    return this.page === 'extras' && this.currentRoute();
  }

  get routeDisplayName() {
    const route = this.currentRoute();
    if (!route) return 'Select route...';
    return `${route.departure_airport.iata_code}-${route.arrival_airport.iata_code} ${route.flight_number}`;
  }

  get aircraftDisplayName() {
    const aircraft = this.currentAircraft();
    if (!aircraft) return 'Select aircraft...';
    return `${aircraft.aircraft.name} (${aircraft.tail_number})`;
  }

  // Time input helpers
  private timeStringToDateTime(timeStr: string, baseDate: Date): string {
    if (!timeStr || !baseDate) return '';

    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateTime = new Date(baseDate);
    dateTime.setHours(hours, minutes, 0, 0);

    return dateTime.toISOString();
  }

  private calculateArrivalTime(): string {
    if (!this.departureTime || !this.flightDurationMinutes || !this.flightDate)
      return '';

    const [depHours, depMinutes] = this.departureTime.split(':').map(Number);

    const departure = new Date(this.flightDate);
    departure.setHours(depHours, depMinutes, 0, 0);

    const arrival = new Date(departure);
    arrival.setMinutes(arrival.getMinutes() + this.flightDurationMinutes);

    return arrival.toISOString();
  }

  // Extra management methods
  closeDetails() {
    this.extrasDetail = null;
    this.currentExtra.set(undefined);
    this.extraPrice = 0;
    this.extraLimit = 1;
  }

  openDetails(type: 'new' | number) {
    this.extrasDetail = type;
    if (type == 'new') {
      this.currentExtra.set(undefined);
      this.extraPrice = 0;
      this.extraLimit = 1;
    } else {
      const extra = this.flightExtras[type];
      // Find the corresponding available extra
      const availableExtra = this.unavailableExtras.find(
        (ae) => ae.name === extra.name
      );
      this.currentExtra.set(availableExtra);
      this.extraPrice = extra.price;
      this.extraLimit = extra.limit;
    }
  }

  saveExtra() {
    if (this.extrasDetail === 'new') {
      // Add new extra logic
      const selectedExtra = this.currentExtra();
      if (!selectedExtra || this.extraPrice <= 0) return;

      const newExtra: FlightExtra = {
        id: selectedExtra.id,
        name: selectedExtra.name,
        description: selectedExtra.description,
        price: this.extraPrice,
        limit: this.extraLimit,
        stackable: selectedExtra.stackable,
      };
      this.flightExtras.push(newExtra);
      this.availableExtras = this.availableExtras.filter(extra => extra.id !== selectedExtra.id);
      this.unavailableExtras.push(selectedExtra);
    } else if (typeof this.extrasDetail === 'number') {
      this.flightExtras[this.extrasDetail].price = this.extraPrice;
      this.flightExtras[this.extrasDetail].limit = this.extraLimit;
    }
    this.closeDetails();
  }

  removeExtra(index: number, modalCtx: any) {
    this.flightExtras.splice(index, 1)[0];
    this.availableExtras.push(this.unavailableExtras[index]);
    this.unavailableExtras.splice(index, 1);
    modalCtx.close();
  }

  // Form validation
  get isFormValid(): boolean {
    return !!(
      this.currentRoute() &&
      this.currentAircraft() &&
      this.flightDate &&
      this.departureTime &&
      this.flightDurationMinutes > 0 &&
      this.priceEconomyClass > 0 &&
      this.priceBusinessClass > 0 &&
      this.priceFirstClass > 0 &&
      this.priceInsurance >= 0
    );
  }

  // Save flight
  async saveFlight() {
    if (!this.isFormValid || this.isSaving) return;

    try {
      this.isSaving = true;
      this.loadingService.startLoadingTask();

      const route = this.currentRoute()!;
      const aircraft = this.currentAircraft()!;

      const departureDateTime = this.timeStringToDateTime(
        this.departureTime,
        this.flightDate!
      );
      const arrivalDateTime = this.calculateArrivalTime();

      const flightData = {
        route_id: route.id,
        aircraft_id: aircraft.id,
        departure_time: departureDateTime,
        arrival_time: arrivalDateTime,
        price_economy_class: this.priceEconomyClass,
        price_business_class: this.priceBusinessClass,
        price_first_class: this.priceFirstClass,
        price_insurance: this.priceInsurance,
        gate: this.gate || undefined,
        terminal: this.terminal || undefined,
        checkin_start_time: this.checkinStartTime ? this.timeStringToDateTime(this.checkinStartTime, this.flightDate!) : undefined,
        checkin_end_time: this.checkinEndTime ? this.timeStringToDateTime(this.checkinEndTime, this.flightDate!) : undefined,
        boarding_start_time: this.boardingStartTime ? this.timeStringToDateTime(this.boardingStartTime, this.flightDate!) : undefined,
        boarding_end_time: this.boardingEndTime ? this.timeStringToDateTime(this.boardingEndTime, this.flightDate!) : undefined,
        extras: this.flightExtras.map((extra) => ({
          extra_id: this.isEditMode ? extra.extra_id! : extra.id,
          price: extra.price,
          limit: extra.limit,
        })),
      };

      if (this.isEditMode && this.flightId) {
        // Update existing flight - convert route_id to string for update
        const updateData = {
          ...flightData,
          route_id: flightData.route_id
        };
        await firstValueFrom(
          this.airlineFetchService.updateFlight(this.flightId, updateData)
        );
      } else {
        // Create new flight
        await firstValueFrom(
          this.airlineFetchService.addFlight(flightData)
        );
      }

      // Navigate back to flights list
      this.router.navigate(['/flights']);
    } catch (error) {
      console.error(this.isEditMode ? 'Errore nell\'aggiornamento del volo:' : 'Errore nel salvataggio del volo:', error);
    } finally {
      this.isSaving = false;
      this.loadingService.endLoadingTask();
    }
  }

  protected readonly formatTime = formatTime;
  protected readonly dateToString = dateToString;
  protected readonly Math = Math;
  protected toDate(date: string) {
    return new Date(date);
  }
}
