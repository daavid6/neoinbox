import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';

import { environment } from './private/enviroments/enviroment';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
		provideAuth(() => getAuth()),
		provideHttpClient(),
		provideAnimationsAsync(),
    	provideHttpClient(withInterceptors([authInterceptor])),
	],
};
