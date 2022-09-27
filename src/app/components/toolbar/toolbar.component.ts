import { Component } from '@angular/core';

import { BrightnessService } from '../../services/brightness/brightness.service';

@Component({
  selector: 'app-toolbar',
  styleUrls: ['./toolbar.component.scss'],
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {

  get isDarkTheme(): boolean {
    return this.brightness.isDarkTheme;
  }

  get isLightTheme(): boolean {
    return this.brightness.isLightTheme;
  }

  constructor(
    private readonly brightness: BrightnessService,
  ) { }

  toggleBrightness(): void {
    this.brightness.toggleBrightness();
  }
}
