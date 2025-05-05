import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { PopoverComponent } from '@/app/components/popover/popover.component';
import { PopoverTriggerDirective } from '../popover/popover-trigger.directive';
import { CommonModule } from '@angular/common';
import { HlmCalendarComponent } from '@spartan-ng/ui-calendar-helm';
import { MonthPickerComponent } from './month-picker/month-picker.component';
import {
  HlmTabsComponent,
  HlmTabsContentDirective,
  HlmTabsListComponent,
  HlmTabsTriggerDirective,
} from '@spartan-ng/ui-tabs-helm';

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
  ],
  templateUrl: './date-input.component.html',
})
export class DateInputComponent {
  @Input() public popoverRelativePosition: {
    additionalTop?: number;
    additionalLeft?: number;
  } = {
    additionalTop: 0,
    additionalLeft: 0,
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


  public focus() {
    this.popover.open();
  }

  public formatDate(date: Date) {
    if (this.dateType === 'specific') {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
  }

  public onDateTypeChange(dateType: 'specific' | 'flexible') {
    this.dateType = dateType;
    this.dateTypeChange.emit(dateType);
  }

  public onValueChange(value: Date) {
    this.value = value;
    this.valueChange.emit(this.value);
    this.popover.close();
    if (this.nextInputRef) {
      this.nextInputRef.focus();
    }
  }
}
