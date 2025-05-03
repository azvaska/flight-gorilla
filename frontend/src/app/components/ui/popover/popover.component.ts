import {
  Component,
  ContentChild,
  ElementRef,
  HostListener,
  Input,
  AfterContentInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { PopoverTriggerDirective } from './popover-trigger.directive';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-popover',
  exportAs: 'appPopover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.css'],
  imports: [CommonModule, PopoverTriggerDirective],
})
export class PopoverComponent {
  @Input() customValues: {
    additionalTop?: number;
    additionalLeft?: number;
    width?: string;
  } = {
    additionalTop: 0,
    additionalLeft: 0,
    width: 'auto',
  };

  @ContentChild(PopoverTriggerDirective) triggerDir!: PopoverTriggerDirective;
  @ViewChild('popover') popoverEl!: ElementRef<HTMLElement>;

  popoverStyles!: { top: string; left: string; width: string };
  showPopover = false;

  open() {
    if (!this.showPopover) {
      this.updatePosition();
      this.showPopover = true;
    }
  }

  close() {
    this.showPopover = false;
  }

  toggle() {
    this.showPopover ? this.close() : this.open();
  }

  private updatePosition() {
    const rect = this.triggerDir.el.nativeElement.getBoundingClientRect();
    this.popoverStyles = {
      top: `${rect.height + (this.customValues.additionalTop ?? 0)}px`,
      left: `${this.customValues.additionalLeft ?? 0}px`,
      width: this.customValues.width ?? 'auto',
    };
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (
      !this.triggerDir.el.nativeElement.contains(target) &&
      !this.popoverEl?.nativeElement.contains(target)
    ) {
      this.close();
    }
  }
}
