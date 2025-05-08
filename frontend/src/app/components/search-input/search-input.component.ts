import {
  Component,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverComponent } from '@/app/components/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/popover/popover-trigger.directive';

export interface SearchInputValue<T> {
  value: string;
  data: T | undefined;
}


@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html',
  imports: [CommonModule, PopoverComponent, PopoverTriggerDirective],
})
export class SearchInputComponent<T> {
  @Input() public placeHolder: string = '';
  @Input() public popoverRelativePosition: {
    additionalTop?: number;
    additionalLeft?: number;
  } = {
    additionalTop: 0,
    additionalLeft: 0,
  };
  @Input() public popoverWidth: string = 'auto';
  @Input() public noResultsText: string = 'No results found.';

  @Input() public inputValue: SearchInputValue<T> | undefined = undefined;
  @Output() public inputValueChange = new EventEmitter<SearchInputValue<T>>();

  @Input() public nextInputRef?: {
    focus: () => void;
  };

  @ViewChild('popover') popover!: PopoverComponent;
  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;

  @Input() public searchList: SearchInputValue<T>[] = [];

  private _search: string = this.inputValue?.value ?? '';

  get filteredList() {
    return this.searchList.filter((item) =>
      item.value.toLowerCase().startsWith(this._search.toLowerCase())
    );
  }

  focus() {
    this.input.nativeElement.focus();
    this.popover.open();
  }

  onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._search = input.value;

    if (this._search.length === 0) {
      this.popover.close();
      return;
    }
    this.popover.open();
  }

  onSelect(item: SearchInputValue<T>) {
    this.inputValue = item;
    this.inputValueChange.emit(item);
    this.popover.close();
    if (this.nextInputRef) {
      this.nextInputRef.focus();
    }
  }
}
