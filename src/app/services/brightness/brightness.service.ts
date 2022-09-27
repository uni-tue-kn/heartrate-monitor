import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrightnessService {

  private _isDarkTheme = false;

  get isDarkTheme(): boolean {
    return this._isDarkTheme;
  }

  get isLightTheme(): boolean {
    return !this._isDarkTheme;
  }

  setDarkTheme(): void {
    this._isDarkTheme = true;
  }

  setLightTheme(): void {
    this._isDarkTheme = false;
  }

  toggleBrightness(): void {
    this._isDarkTheme = !this._isDarkTheme;
  }
}
