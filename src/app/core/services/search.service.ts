import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly searchTermSubject = new BehaviorSubject<string>('');

  readonly searchTerm$: Observable<string> = this.searchTermSubject.asObservable();

  getSearchTerm(): string {
    return this.searchTermSubject.value;
  }

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  clearSearchTerm(): void {
    this.searchTermSubject.next('');
  }
}
