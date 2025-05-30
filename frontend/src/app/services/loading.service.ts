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
    console.log('startLoadingTask', this.loadingCount);
    this.loadingCount++;
    if (this.loadingCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  endLoadingTask(): void {
    console.log('endLoadingTask', this.loadingCount);
    if (this.loadingCount > 0) {
      this.loadingCount--;
      if (this.loadingCount === 0) {
        console.log('Fully loaded');
        this.loadingSubject.next(false);
      }
    }
  }
}
