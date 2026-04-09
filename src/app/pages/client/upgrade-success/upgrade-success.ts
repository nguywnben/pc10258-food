import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-upgrade-success',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './upgrade-success.html',
})
export class UpgradeSuccess implements AfterViewInit {
  ngAfterViewInit(): void {
    if (typeof document === 'undefined') return;
    if (document.querySelector('script#food-main-js')) return;

    const script = document.createElement('script');
    script.id = 'food-main-js';
    script.src = 'assets/js/main.js';
    document.body.appendChild(script);
  }
}

