import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    providers: [provideHttpClient()],
  });

export default bootstrap;
