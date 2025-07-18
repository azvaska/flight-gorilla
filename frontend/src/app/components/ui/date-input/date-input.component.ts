import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { PopoverComponent } from '@/app/components/ui/popover/popover.component';
import { PopoverTriggerDirective } from '@/app/components/ui/popover/popover-trigger.directive';
import { CommonModule } from '@angular/common';
import { HlmCalendarComponent } from '@spartan-ng/ui-calendar-helm';
import { MonthPickerComponent } from './month-picker/month-picker.component';
import {
  HlmTabsComponent,
  HlmTabsContentDirective,
  HlmTabsListComponent,
  HlmTabsTriggerDirective,
} from '@spartan-ng/ui-tabs-helm';
import { formatDate } from '@/utils/date';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleX } from '@ng-icons/lucide';
@Component({
  selector: 'date-input',
  imports: [
    CommonModule,
    PopoverComponent,
    PopoverTriggerDirective,
    HlmCalendarComponent,
    HlmTabsComponent,
    HlmTabsContentDirective,
    HlmTabsListComponent,
    HlmTabsTriggerDirective,
    MonthPickerComponent,
    NgIcon,
  ],
  templateUrl: './date-input.component.html',
  providers: [provideIcons({ lucideCircleX })],
  host: {
    class: 'block',
  }
})
export class DateInputComponent {
  @Input() public popoverRelativePosition: {
    top?: number;
    left?: number;
  } = {
    top: 0,
    left: 0,
  };
  @Input() public popoverWidth: string = 'auto';
  @Input() public placeholder: string = 'Add a date';

  @Input() public nextInputRef?: {
    focus: () => void;
  };

  @Input() public minDate: Date | undefined = new Date();
  @Input() public maxDate: Date | undefined = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  );

  @Input() public dateType: 'specific' | 'flexible' = 'specific';
  @Output() public dateTypeChange = new EventEmitter<'specific' | 'flexible'>();

  @ViewChild('popover') public popover!: PopoverComponent;

  @Input() public value: Date | undefined = undefined;
  @Output() public valueChange = new EventEmitter<Date>();

  @Input() public enableFlexibleDate: boolean = true;

  protected formatDate = formatDate;



  public focus() {
    this.popover.open();
  }

  protected get isOpen() {
    return this.popover?.showPopover ?? false;
  }

  public onDateTypeChange(dateType: 'specific' | 'flexible') {
    this.dateType = dateType;
    this.dateTypeChange.emit(dateType);
  }

  public onValueChange(value: Date) {
    this.value = value;
    this.valueChange.emit(this.value);
    if (value !== undefined) {
      this.popover.close();
    }
    if (this.nextInputRef) {
      this.nextInputRef.focus();
    }
  }

  protected onClear() {
    this.value = undefined;
    this.valueChange.emit(this.value);
  }
}
