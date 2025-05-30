import { LoadingService } from '@/app/services/loading.service';
import { Component } from '@angular/core';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
@Component({
  selector: 'app-loading',
  imports: [HlmSpinnerComponent],
  templateUrl: './loading.component.html',
})
export class LoadingComponent {
  protected loading = false;

  constructor(private loadingService: LoadingService) {
    this.loadingService.loading$.subscribe((loading) => {
      this.loading = loading;
    });
  }
}
