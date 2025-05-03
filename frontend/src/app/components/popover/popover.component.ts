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
  imports: [CommonModule],
})
export class PopoverComponent {
  @Input() popoverRelativePosition: {
    additionalTop?: number;
    additionalLeft?: number;
  } = {
    additionalTop: 0,
    additionalLeft: 0,
  };
  @Input() popoverWidth: string = 'auto';

  @ContentChild(PopoverTriggerDirective) triggerDir!: PopoverTriggerDirective;
  @ViewChild('popover') popoverEl!: ElementRef<HTMLElement>;

  popoverStyles!: { top: string; left: string; width: string };
  showPopover = false;
  private ignoreOutsideClick = false;

  open() {
    if (!this.showPopover) {
      this.updatePosition();
      this.showPopover = true;
      this.ignoreOutsideClick = true;
      setTimeout(() => (this.ignoreOutsideClick = false), 0);
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
      top: `${
        rect.height + (this.popoverRelativePosition.additionalTop ?? 0)
      }px`,
      left: `${this.popoverRelativePosition.additionalLeft ?? 0}px`,
      width: this.popoverWidth,
    };
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: HTMLElement) {
    if (this.ignoreOutsideClick) {
      return;
    }
    if (
      !this.triggerDir.el.nativeElement.contains(target) &&
      !this.popoverEl?.nativeElement.contains(target)
    ) {
      this.close();
    }
  }

}
