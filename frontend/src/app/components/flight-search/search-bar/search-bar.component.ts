import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';
import {
  SearchInputComponent,
  SearchInputValue,
} from '@/app/components/search-input/search-input.component';
import { DateInputComponent } from '@/app/components/date-input/date-input.component';
import { Router } from '@angular/router';
import { dateToString } from '@/utils/date';
import { SearchFetchService } from '@/app/services/search/search-fetch.service';
import { ILocation } from '@/types/search/location';

@Component({
  selector: 'flight-search-bar',
  imports: [SearchInputComponent, DateInputComponent],
  templateUrl: './search-bar.component.html',
})
export class FlightSearchBarComponent implements OnInit {
  @ViewChild('firstLocationInput')
  private readonly _firstLocationInput!: SearchInputComponent<ILocation>;
  @ViewChild('secondLocationInput')
  private readonly _secondLocationInput!: SearchInputComponent<ILocation>;
  @ViewChild('firstDateInput')
  private readonly _firstDateInput!: DateInputComponent;
  @ViewChild('secondDateInput')
  private readonly _secondDateInput!: DateInputComponent;

  @Input() public autoFocus: boolean = true;
  @Input() public searchCallback: () => void = this.defaultSearchCallback;

  @Input() public departureLocation: ILocation | undefined = undefined;
  @Input() public arrivalLocation: ILocation | undefined = undefined;
  @Input() public departureDate: Date | undefined = undefined;
  @Input() public returnDate: Date | undefined = undefined;
  @Output() public departureLocationChange = new EventEmitter<ILocation>();
  @Output() public arrivalLocationChange = new EventEmitter<ILocation>();
  @Output() public departureDateChange = new EventEmitter<Date>();
  @Output() public returnDateChange = new EventEmitter<Date>();
  @Input() public dateType: 'specific' | 'flexible' = 'specific';
  @Output() public dateTypeChange = new EventEmitter<'specific' | 'flexible'>();

  public departureDateMinDate: Date | undefined = undefined;

  constructor(
    private router: Router,
    private searchFetchService: SearchFetchService
  ) {
    this.onDepartureSearchChange('');
    this.onArrivalSearchChange('');
  }

  protected anywhereObject: SearchInputValue<ILocation> = {
    value: 'Anywhere',
    data: {
      id: undefined,
      name: 'Anywhere',
      type: 'anywhere',
    },
  };

  public onDepartureSearchChange(value: string) {
    this.searchFetchService
      .getAllLocations(value, false)
      .subscribe((locations) => {
        this.departureLocationsList = locations.map((location) => ({
          value: location.name,
          data: location,
        }));
      });
  }

  public onArrivalSearchChange(value: string) {
    this.searchFetchService
      .getAllLocations(value, true)
      .subscribe((locations) => {
        this.arrivalLocationsList = locations.map((location) => ({
          value: location.name,
          data: location,
        }));
      });
  }

  ngOnInit() {
    this.updateMinDate();
  }

  protected departureLocationsList: SearchInputValue<ILocation>[] = [];

  protected arrivalLocationsList: SearchInputValue<ILocation>[] = [];

  public get firstLocationInput() {
    if (!this.autoFocus) {
      return undefined;
    }
    return this._firstLocationInput;
  }

  get secondLocationInput() {
    if (!this.autoFocus) {
      return undefined;
    }
    return this._secondLocationInput;
  }

  get firstDateInput() {
    if (!this.autoFocus) {
      return undefined;
    }
    return this._firstDateInput;
  }

  get secondDateInput() {
    if (!this.autoFocus) {
      return undefined;
    }
    return this._secondDateInput;
  }

  public onDepartureDateChange(date: Date | undefined) {
    this.departureDate = date;
    this.departureDateChange.emit(date);
    this.updateMinDate();
    this.onReturnDateChange(undefined);
  }

  public onReturnDateChange(date: Date | undefined) {
    this.returnDate = date;
    this.returnDateChange.emit(date);
  }

  public onDateTypeChange(dateType: 'specific' | 'flexible') {
    this.dateType = dateType;
    this.dateTypeChange.emit(dateType);
    this.onDepartureDateChange(undefined);
  }

  public onSearchClick() {
    if (this.departureLocation == undefined) {
      this._firstLocationInput.focus();
      return;
    }

    if (this.arrivalLocation == undefined) {
      this._secondLocationInput.focus();
      return;
    }

    if (this.departureDate == undefined) {
      this._firstDateInput.focus();
      return;
    }

    this.searchCallback();
  }

  private defaultSearchCallback() {
    if (
      this.departureLocation === undefined ||
      this.arrivalLocation === undefined ||
      this.departureDate === undefined
    ) {
      console.error('Missing required parameters');
      return;
    }

    const queryParams: any = {
      from_type: this.departureLocation.type,
      from_id: this.departureLocation.id,
      to_type: this.arrivalLocation.type,
      to_id: this.arrivalLocation.id,
      departure_date: dateToString(this.departureDate, this.dateType),
      return_date: this.returnDate
        ? dateToString(this.returnDate, this.dateType)
        : undefined,
      date_type: this.dateType,
    };

    this.router.navigate(['/search'], {
      queryParams,
    });
  }

  private updateMinDate() {
    if (this.departureDate == null) {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      this.departureDateMinDate = d;
    } else {
      this.departureDateMinDate = new Date(this.departureDate);
    }
  }
}
