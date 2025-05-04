import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { PopoverComponent } from '@/app/components/popover/popover.component';
import { PopoverTriggerDirective } from '../popover/popover-trigger.directive';
import { CommonModule } from '@angular/common';
import { HlmCalendarComponent } from '@spartan-ng/ui-calendar-helm';
@Component({
  selector: 'date-input',
  imports: [
    CommonModule,
    PopoverComponent,
    PopoverTriggerDirective,
    HlmCalendarComponent,
  ],
  templateUrl: './date-input.component.html',
})
export class DateInputComponent {
  @Input() placeHolder: string = '';
  @Input() popoverRelativePosition: {
    additionalTop?: number;
    additionalLeft?: number;
  } = {
    additionalTop: 0,
    additionalLeft: 0,
  };
  @Input() popoverWidth: string = 'auto';
  @Input() placeholder: string = 'Add a date';

  @Input() nextInputRef?: {
    focus: () => void;
  };

  @Input() date: Date | undefined = undefined;
  @Output() dateChange = new EventEmitter<Date>();

  
  @Input() minDate: Date | undefined = new Date();
  @Input() maxDate: Date | undefined = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
  
  @ViewChild('popover') popover!: PopoverComponent;

  focus() {
    this.popover.open();
  }

  formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  onDateChange(date: Date) {
    this.date = date;
    this.dateChange.emit(date);
    this.popover.close();
    if (this.nextInputRef) {
      this.nextInputRef.focus();
    }
  }
}
