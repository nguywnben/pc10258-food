import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
})
export class Home implements AfterViewInit {
  ngAfterViewInit(): void {
    // Load the provided static JS after Angular renders DOM,
    // so handlers (plus/minus, header time) can find elements.
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}