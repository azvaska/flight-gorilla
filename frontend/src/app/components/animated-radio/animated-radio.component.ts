import {
  Component,
  forwardRef,
  Input
} from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor
} from '@angular/forms';

@Component({
  selector: 'app-animated-radio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './animated-radio.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AnimatedRadioComponent),
      multi: true
    }
  ]
})
export class AnimatedRadioComponent implements ControlValueAccessor {
  /** group name (so you can have multiple radios) */
  @Input() name = '';

  /** this radio’s value */
  @Input() value: any;

  /** internally track checked state */
  checked = false;

  // placeholder fns
  private onChange = (_: any) => {};
  private onTouched = () => {};

  // ControlValueAccessor API
  writeValue(obj: any): void {
    this.checked = obj === this.value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /** called when user clicks the control */
  setChecked() {
    if (!this.checked) {
      this.checked = true;
      this.onChange(this.value);
      this.onTouched();
    }
  }
}
