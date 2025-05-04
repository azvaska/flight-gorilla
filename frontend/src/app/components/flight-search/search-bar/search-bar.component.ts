import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { SearchInputComponent } from '@/app/components/search-input/search-input.component';
import { DateInputComponent } from '@/app/components/date-input/date-input.component';
@Component({
  selector: 'flight-search-bar',
  imports: [SearchInputComponent, DateInputComponent],
  templateUrl: './search-bar.component.html',
})
export class FlightSearchBarComponent {
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

  // We reset return date when user changes departure
  public onDepartureDateChange() {
    this.returnDate = undefined;
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
}
