import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loginUrl = router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url || '/' },
  });

  if (!authService.getToken()) {
    return loginUrl;
  }

  if (authService.getCurrentUser()) {
    return true;
  }

  return authService.refreshCurrentUser().pipe(
    map((user) => (user ? true : loginUrl)),
    catchError(() => of(loginUrl)),
  );
};
