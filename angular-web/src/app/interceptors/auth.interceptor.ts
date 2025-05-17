import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getJwtToken();
  
  if (!token || 
      req.url.endsWith('/') || 
      req.url.includes('/docs') || 
      req.url.includes('/auth-url') || 
      req.url.includes('/auth-token')) {
    return next(req);
  }
  
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  
  return next(authReq);
};