import { LoadingService } from '@/app/services/loading.service';
import { Component, OnDestroy } from '@angular/core';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

@Component({
  selector: 'app-loading',
  imports: [HlmSpinnerComponent],
  templateUrl: './loading.component.html',
})
export class LoadingComponent implements OnDestroy {
  protected loading = false;

  constructor(private loadingService: LoadingService) {
    this.loadingService.loading$.subscribe((loading) => {
      this.loading = loading;
      
      // Control body overflow to prevent scrolling
      if (loading) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    });
  }

  ngOnDestroy() {
    // Clean up: ensure overflow is restored when component is destroyed
    document.body.classList.remove('overflow-hidden');
  }
}
