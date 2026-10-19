import { bootstrapApplication } from '@angular/platform-browser';
import { createAppConfig } from './app/app.config';
import { App } from './app/app';
import { fetchAppConfig } from './app/core/config/app-config-store';

fetchAppConfig()
  .then((config) => bootstrapApplication(App, createAppConfig(config)))
  .catch((err) => console.error(err));
