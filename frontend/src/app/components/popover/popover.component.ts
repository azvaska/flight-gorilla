import {
  Component,
  ContentChild,
  ElementRef,
  HostListener,
  Input,
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
  @Input() public popoverRelativePosition: {
    top?: number;
    left?: number;
    right?: number;
  } = {}
  @Input() public popoverWidth: string = 'auto';
  @Input() public preventDefaultBehavior: boolean = false;

  @ContentChild(PopoverTriggerDirective)
  public readonly triggerDir!: PopoverTriggerDirective;
  @ViewChild('popover') public readonly popoverEl!: ElementRef<HTMLElement>;

  public popoverStyles!: {
    top: string;
    left: string;
    right: string;
    width: string;
  };
  public showPopover = false;

  private _ignoreOutsideClick = true;

  public ngAfterViewInit() {
    if (!this.preventDefaultBehavior) {
      this.triggerDir.el.nativeElement.addEventListener('click', () => {
        this.toggle();
      });
    }
  }

  public open() {
    if (!this.showPopover) {
      this.updatePosition();
      this.showPopover = true;
      this._ignoreOutsideClick = true;
      setTimeout(() => (this._ignoreOutsideClick = false), 0);
    }
  }

  public close() {
    this.showPopover = false;
  }

  public toggle() {
    this.showPopover ? this.close() : this.open();
  }

  private updatePosition() {
    const rect = this.triggerDir.el.nativeElement.getBoundingClientRect();
    this.popoverStyles = {
      top: `${
        rect.height + (this.popoverRelativePosition.top ?? 0)
      }px`,
      left: this.popoverRelativePosition.left !== undefined
        ? this.popoverRelativePosition.left + 'px'
        : '',
      right: this.popoverRelativePosition.right !== undefined
        ? this.popoverRelativePosition.right + 'px'
        : '',
      width: this.popoverWidth,
    };
  }

  @HostListener('document:click', ['$event.target'])
  public onClickOutside(target: HTMLElement) {
    if (this._ignoreOutsideClick) {
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
