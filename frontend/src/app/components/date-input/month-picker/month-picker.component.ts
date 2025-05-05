import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import { HlmCardDirective } from '@spartan-ng/ui-card-helm';

@Component({
  selector: 'month-picker',
  imports: [CommonModule, NgIcon, HlmIconDirective, HlmCardDirective],
  viewProviders: [provideIcons({ lucideChevronLeft, lucideChevronRight })],
  templateUrl: './month-picker.component.html',
})
export class MonthPickerComponent {
  @Input() public selectedDate: Date | undefined = undefined;
  @Output() public selectedDateChange = new EventEmitter<Date>();

  @Input() public minDate: Date | undefined = undefined;
  @Input() public maxDate: Date | undefined = undefined;
  @Input() public currentYear: number = new Date().getFullYear();

  public goToNextYear() {
    if (!this.maxDate || this.currentYear < this.maxDate.getFullYear()) {
      this.currentYear++;
    }
  }

  public goToPreviousYear() {
    if (!this.minDate || this.currentYear > this.minDate.getFullYear()) {
      this.currentYear--;
    }
  }

  public onSelectDate(month: number, year: number) {
    this.selectedDate = new Date(year, month, 1);
    this.selectedDateChange.emit(this.selectedDate);
  }
}
