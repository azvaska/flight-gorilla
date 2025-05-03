import { Component, ViewChild, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverComponent } from '@/app/components/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/popover/popover-trigger.directive';

@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html',
  imports: [CommonModule, PopoverComponent, PopoverTriggerDirective],
})
export class SearchInputComponent {
  @Input() placeHolder: string = '';
  @Input() popoverRelativePosition: {
    additionalTop?: number;
    additionalLeft?: number;
  } = {
    additionalTop: 0,
    additionalLeft: 0,
  };
  @Input() popoverWidth: string = 'auto';
  @Input() noResultsText: string = 'No results found.';

  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  @Input() nextInputRef?: {
    focus: () => void;
  };

  @ViewChild('popover') popover!: PopoverComponent;
  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;

  searchList = ['hello', 'world', 'test', 'pxa', 'heas', 'world1', 'hello1'];

  get filteredList() {
    return this.searchList.filter((item) => item.startsWith(this.value));
  }

  focus() {
    this.input.nativeElement.focus();
    this.popover.open();
  }

  onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;

    if (this.value.length === 0) {
      this.popover.close();
      return;
    }
    this.popover.open();
  }

  onSelect(item: string) {
    this.value = item;
    this.valueChange.emit(item);
    this.popover.close();
    if (this.nextInputRef) {
      this.nextInputRef.focus();
    }
  }
}
