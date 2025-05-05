import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';
import { SearchInputComponent } from '@/app/components/search-input/search-input.component';
import { DateInputComponent } from '@/app/components/date-input/date-input.component';
@Component({
  selector: 'flight-search-bar',
  imports: [SearchInputComponent, DateInputComponent],
  templateUrl: './search-bar.component.html',
})
export class FlightSearchBarComponent implements OnInit {
  @ViewChild('firstLocationInput')
  private readonly _firstLocationInput!: SearchInputComponent;
  @ViewChild('secondLocationInput')
  private readonly _secondLocationInput!: SearchInputComponent;
  @ViewChild('firstDateInput')
  private readonly _firstDateInput!: DateInputComponent;
  @ViewChild('secondDateInput')
  private readonly _secondDateInput!: DateInputComponent;

  @Input() public autoFocus: boolean = true;
  @Input() public searchCallback!: () => void;

  @Input() public departurePlace: string | undefined = undefined;
  @Input() public arrivalPlace: string | undefined = undefined;
  @Input() public departureDate: Date | undefined = undefined;
  @Input() public returnDate: Date | undefined = undefined;
  @Output() public departurePlaceChange = new EventEmitter<string>();
  @Output() public arrivalPlaceChange = new EventEmitter<string>();
  @Output() public departureDateChange = new EventEmitter<Date>();
  @Output() public returnDateChange = new EventEmitter<Date>();

  @Input() public dateType: 'specific' | 'flexible' = 'specific';
  @Output() public dateTypeChange = new EventEmitter<'specific' | 'flexible'>();

  public departureDateMinDate: Date | undefined = undefined;

  ngOnInit() {
    this.updateMinDate();
  }

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
    if (this.departurePlace == undefined) {
      this._firstLocationInput.focus();
      return;
    }

    if (this.arrivalPlace == undefined) {
      this._secondLocationInput.focus();
      return;
    }

    if (this.departureDate == undefined) {
      this._firstDateInput.focus();
      return;
    }

    if (this.returnDate == undefined) {
      this._secondDateInput.focus();
      return;
    }

    this.searchCallback();

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
