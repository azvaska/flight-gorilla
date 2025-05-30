import {
  Component,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleX } from '@ng-icons/lucide';
import Fuse from 'fuse.js';

export interface SearchInputValue<T> {
  value: string;
  data: T | undefined;
}


@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html',
  imports: [CommonModule, PopoverComponent, PopoverTriggerDirective, NgIcon],
  providers: [provideIcons({ lucideCircleX })],
})
export class SearchInputComponent<T> {
  @Input() public placeHolder: string = '';
  @Input() public popoverRelativePosition: {
    top?: number;
    left?: number;
  } = {
    top: 0,
    left: 0,
  };
  @Input() public popoverWidth: string = 'auto';
  @Input() public noResultsText: string = 'No results found.';

  @Input() public inputValue: SearchInputValue<T> | undefined = undefined;
  @Output() public inputValueChange = new EventEmitter<SearchInputValue<T> | undefined>();

  @Output() public searchValueChange = new EventEmitter<string>();

  @Input() public nextInputRef?: {
    focus: () => void;
  };
  @Input() public searchList: SearchInputValue<T>[] = [];
  @Input() public alwaysVisibleItems: SearchInputValue<T>[] = [];

  @Input() public searchWithinComponent: boolean = true;

  @ViewChild('popover') popover!: PopoverComponent;
  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;

  protected search: string = '';

  protected filteredList: SearchInputValue<T>[] = []

  ngOnInit(): void {
    this.search = this.inputValue?.value ?? '';
  }


  protected filterList(searchList: SearchInputValue<T>[], search: string) {

    if(searchList.length === 0) {
      return [];
    }
    
    const fuse = new Fuse(searchList, {
      keys: ['value'],
      threshold: 0.5,
    });

    return fuse.search(search).slice(0, 5).map((result) => result.item);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchList']) {
      this.filteredList = this.filterList(this.searchList, this.search);
    }
  }

  protected get isOpen() {
    return this.popover?.showPopover ?? false;
  }


  focus() {
    this.input.nativeElement.focus();
    this.popover.open();
  }

  onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.search = input.value;
    this.searchValueChange.emit(this.search);

    if (this.searchWithinComponent) {
      this.filteredList = this.filterList(this.searchList, this.search);
    }

    if (this.search.length === 0) {
      this.popover.close();
      return;
    }
    this.popover.open();
  }

  onSelect(item: SearchInputValue<T>) {
    this.inputValue = item;
    this.search = item.value;
    this.inputValueChange.emit(item);
    this.popover.close();
    if (this.nextInputRef) {
      this.nextInputRef.focus();
    }
  }

  protected onClear() {
    this.inputValue = undefined;
    this.search = '';
    this.searchValueChange.emit('');
    this.inputValueChange.emit(this.inputValue);
    this.popover.close();

    if (this.searchWithinComponent) {
      this.filteredList = this.filterList(this.searchList, this.search);
    }
  }
}
