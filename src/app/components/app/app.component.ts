import { Component } from '@angular/core';

import { BrightnessService } from '../../services/brightness/brightness.service';

@Component({
  selector: 'app-root',
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html',
})
export class AppComponent {

  get isDarkTheme(): boolean {
    return this.brightness.isDarkTheme;
  }

  get isLightTheme(): boolean {
    return this.brightness.isLightTheme;
  }

  constructor(
    private readonly brightness: BrightnessService,
  ) { }
}
