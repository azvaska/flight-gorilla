import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  startLoadingTask(): void {
    this.loadingCount++;
    console.log('startLoadingTask', this.loadingCount);
    if (this.loadingCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  endLoadingTask(): void {
    if (this.loadingCount > 0) {
      this.loadingCount--;
      if (this.loadingCount === 0) {
        this.loadingSubject.next(false);
        console.log('endLoadingTask', this.loadingCount);
      }
    }
  }
}
