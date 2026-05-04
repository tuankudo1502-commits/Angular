import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loginUrl = router.createUrlTree(['/login'], {
    queryParams: { returnUrl: router.url || '/' },
  });

  if (!authService.getToken()) {
    return loginUrl;
  }

  const currentUser = authService.getCurrentUser();
  if (currentUser?.role === 'admin') {
    return true;
  }

  return authService.refreshCurrentUser().pipe(
    map((user) => (user?.role === 'admin' ? true : loginUrl)),
    catchError(() => of(loginUrl)),
  );
};
