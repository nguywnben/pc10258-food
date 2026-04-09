import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [],
  templateUrl: './favorites.html',
})
export class Favorites implements AfterViewInit {
  ngAfterViewInit(): void {
    // Load the provided static JS after Angular renders DOM,
    // so handlers can find elements (e.g. favorite heart).
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}

