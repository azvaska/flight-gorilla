import { BooleanInput, NumberInput } from '@angular/cdk/coercion';
import {
  Component,
  Input,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import {
  BrnCalendarCellButtonDirective,
  BrnCalendarCellDirective,
  BrnCalendarDirective,
  BrnCalendarGridDirective,
  BrnCalendarHeaderDirective,
  BrnCalendarNextButtonDirective,
  BrnCalendarPreviousButtonDirective,
  BrnCalendarWeekDirective,
  BrnCalendarWeekdayDirective,
  Weekday,
  injectBrnCalendarI18n,
} from '@spartan-ng/brain/calendar';
import { hlm } from '@spartan-ng/brain/core';
import { injectDateAdapter } from '@spartan-ng/brain/date-time';
import { buttonVariants } from '@spartan-ng/ui-button-helm';
import { HlmIconDirective } from '@spartan-ng/ui-icon-helm';
import type { ClassValue } from 'clsx';
import { NgIf, NgClass } from '@angular/common';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

@Component({
  selector: 'price-calendar',
  imports: [
    BrnCalendarDirective,
    BrnCalendarHeaderDirective,
    BrnCalendarNextButtonDirective,
    BrnCalendarPreviousButtonDirective,
    BrnCalendarWeekdayDirective,
    BrnCalendarWeekDirective,
    BrnCalendarCellButtonDirective,
    BrnCalendarCellDirective,
    BrnCalendarGridDirective,
    NgIcon,
    HlmIconDirective,
    NgIf,
    NgClass,
    HlmSpinnerComponent,
  ],
  viewProviders: [provideIcons({ lucideChevronLeft, lucideChevronRight })],
  templateUrl: './price-calendar.component.html',
})
export class PriceCalendarComponent<T> {
  public readonly calendarClass = input<ClassValue>('');
  protected readonly _computedCalenderClass = computed(() =>
    hlm('rounded-md border p-3', this.calendarClass())
  );

  /** Array of strings for each day of the current month */
  public readonly prices = input<(number | null)[]>(
    Array.from({ length: 31 }, () => Math.floor(Math.random() * 171) + 31)
  );

  /** Whether the calendar is loading */
  public readonly isLoading = input<boolean>(false);

  /** Callback to be called when the month changes */
  public readonly onMonthChangeCallback = input<
    (month: number, year: number) => void
  >(() => {});

  /** The minimum date that can be selected.*/
  public readonly min = input<T>();

  /** The maximum date that can be selected. */
  public readonly max = input<T>();

  /** Determine if the date picker is disabled. */
  public readonly disabled = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });

  /** The selected value. */
  public readonly date = model<T>();

  /** Whether a specific date is disabled. */
  public readonly dateDisabled = input<(date: T) => boolean>(() => false);

  /** The day the week starts on */
  public readonly weekStartsOn = input<Weekday, NumberInput>(0, {
    transform: (v: unknown) => numberAttribute(v) as Weekday,
  });

  /** The default focused date. */
  @Input() public defaultFocusedDate!: T;

  /** Access the calendar directive */
  private readonly _calendar = viewChild.required(BrnCalendarDirective);

  /** Access the calendar i18n */
  protected readonly i18n = injectBrnCalendarI18n();

  /** Access the date time adapter */
  protected readonly dateAdapter = injectDateAdapter<T>();

  /** Get the heading for the current month and year */
  protected heading = computed(() =>
    this.i18n.formatHeader(
      this.dateAdapter.getMonth(this._calendar().focusedDate()),
      this.dateAdapter.getYear(this._calendar().focusedDate())
    )
  );

  protected readonly categorizedPrices = computed<
    ({ value: number; type: string } | null)[]
  >(() => {
    return this.categorizePrices(this.prices());
  });

  protected readonly btnClass = hlm(
    buttonVariants({ variant: 'ghost' }),
    'h-10 w-10 p-0 font-normal aria-selected:opacity-100',
    'data-[outside]:text-muted-foreground data-[outside]:opacity-50 data-[outside]:aria-selected:bg-accent/50 data-[outside]:aria-selected:text-muted-foreground data-[outside]:aria-selected:opacity-30',
    'data-[today]:bg-accent data-[today]:text-accent-foreground',
    'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground',
    'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50'
  );

  protected inCurrentMonth(cellDate: T): boolean {
    return (
      this.dateAdapter.getMonth(cellDate) ===
        this.dateAdapter.getMonth(this._calendar().focusedDate()) &&
      this.dateAdapter.getYear(cellDate) ===
        this.dateAdapter.getYear(this._calendar().focusedDate())
    );
  }

  /** Check if a date is in the currently focused month */
  protected isAfterCurrentDate(cellDate: T): boolean {

    const focusedDate = new Date()

    const currentDay = focusedDate.getDate();
    const currentMonth = focusedDate.getMonth() + 1;
    const currentYear = focusedDate.getFullYear();

    const cellDay = this.dateAdapter.getDate(cellDate);
    const cellMonth = this.dateAdapter.getMonth(cellDate) + 1;
    const cellYear = this.dateAdapter.getYear(cellDate);

    return (
      cellYear > currentYear ||
      (cellYear === currentYear && cellMonth > currentMonth) ||
      (cellYear === currentYear && cellMonth === currentMonth && cellDay >= currentDay)
    );
  }

  protected categorizePrices(prices: (number | null)[]) {

    const nonNullPrices = prices.filter((price) => price !== null);

    const mean = nonNullPrices.reduce((a, b) => a + b, 0) / nonNullPrices.length;
    const stdDev = Math.sqrt(
      nonNullPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
        nonNullPrices.length
    );
    const margin = 0.5 * stdDev;

    return prices.map((price) => {

      if (price === null) {
        return null;
      }

      let type;
      if (price < mean - margin) {
        type = 'underpriced';
      } else if (price > mean + margin) {
        type = 'overpriced';
      } else {
        type = 'average';
      }
      return { value: price, type };
    });
  }

  /** Get the string entry for a given date */
  protected getPriceForDate(cellDate: T): string {
    if (!this.inCurrentMonth(cellDate)) {
      return '&nbsp;';
    }
    const dayIndex = this.dateAdapter.getDate(cellDate) - 1;
    return this.prices()[dayIndex] ? this.prices()[dayIndex] + '€' : '&nbsp;';
  }

  protected getPriceTypeForDate(cellDate: T): string {
    const dayIndex = this.dateAdapter.getDate(cellDate) - 1;
    return this.categorizedPrices()[dayIndex]?.type || '';
  }

  protected onMonthChange() {
    const currentDate = new Date(this._calendar().focusedDate());
    this.onMonthChangeCallback()(currentDate.getMonth() + 1, currentDate.getFullYear());
    this.defaultFocusedDate = this._calendar().focusedDate();
  }
}
