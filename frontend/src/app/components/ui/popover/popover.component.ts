import {
  Component,
  ContentChild,
  HostListener,
  Input,
  ViewChild,
  ViewContainerRef,
  TemplateRef,
  EmbeddedViewRef,
} from '@angular/core';
import { PopoverTriggerDirective } from './popover-trigger.directive';
import { CommonModule } from '@angular/common';
import {
  Overlay,
  OverlayRef,
  OverlayPositionBuilder,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { filter } from 'rxjs/operators';

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
  } = {};
  @Input() public popoverWidth: string = 'auto';
  @Input() public preventDefaultBehavior: boolean = false;

  @ContentChild(PopoverTriggerDirective)
  public readonly triggerDir!: PopoverTriggerDirective;
  @ViewChild('portalTemplate') private portalTemplate!: TemplateRef<any>;

  public showPopover = false;

  private overlayRef?: OverlayRef;
  private viewRef?: EmbeddedViewRef<any>;
  private panelEl?: HTMLElement;

  constructor(
    private overlay: Overlay,
    private positionBuilder: OverlayPositionBuilder,
    private vcr: ViewContainerRef
  ) {}

  public ngAfterViewInit() {
    if (!this.preventDefaultBehavior) {
      this.triggerDir.el.nativeElement.addEventListener('click', () => {
        console.log('click');
        
        this.toggle();
      });
    }
  }

  public open() {
    if (!this.overlayRef) {
      const positionStrategy = this.positionBuilder
        .flexibleConnectedTo(this.triggerDir.el)
        .withPositions([
          {
            originX:
              this.popoverRelativePosition.right !== undefined
                ? 'end'
                : 'start',
            originY: 'bottom',
            overlayX:
              this.popoverRelativePosition.right !== undefined
                ? 'end'
                : 'start',
            overlayY: 'top',
            offsetX:
              this.popoverRelativePosition.left ??
              (this.popoverRelativePosition.right !== undefined
                ? -this.popoverRelativePosition.right
                : 0),
            offsetY: this.popoverRelativePosition.top ?? 0,
          },
        ]);

      this.overlayRef = this.overlay.create({
        positionStrategy,
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        hasBackdrop: false,
      });

      this.overlayRef
        .outsidePointerEvents()
        .pipe(
          filter((event: MouseEvent) => !this.triggerDir.el.nativeElement.contains(event.target as HTMLElement))
        )
        .subscribe(() => this.close());
    }

    if (!this.overlayRef.hasAttached()) {
      this.viewRef = this.overlayRef.attach(
        new TemplatePortal(this.portalTemplate, this.vcr)
      );
      const roots = this.viewRef.rootNodes.filter(
        (n): n is HTMLElement => n.nodeType === Node.ELEMENT_NODE
      );
      this.panelEl = roots[0];
    }

    this.showPopover = true;
  }

  public close() {
    if (!this.overlayRef || !this.panelEl) return;

    this.showPopover = false;

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'opacity') {
        this.panelEl!.removeEventListener('transitionend', onEnd);
        this.overlayRef!.detach();
        this.overlayRef!.dispose();
        this.overlayRef = undefined;
        this.viewRef = undefined;
        this.panelEl = undefined;
      }
    };

    this.panelEl.addEventListener('transitionend', onEnd);
  }

  public toggle() {
    this.showPopover ? this.close() : this.open();
  }

}
