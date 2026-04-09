import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [],
  templateUrl: './help.html',
})
export class Help implements AfterViewInit {
  ngAfterViewInit(): void {
    // Load the provided static JS after Angular renders DOM,
    // so handlers can find elements.
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}

