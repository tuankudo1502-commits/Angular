import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthService, User } from '../services/auth.service';

const allowUserSite = (user: User | null, adminUrl: UrlTree): boolean | UrlTree => {
  return user?.role === 'admin' ? adminUrl : true;
};

const checkUserAccess = (): boolean | UrlTree | Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const adminUrl = router.createUrlTree(['/admin/dashboard']);

  if (!authService.getToken()) {
    return true;
  }

  const currentUser = authService.getCurrentUser();
  if (currentUser) {
    return allowUserSite(currentUser, adminUrl);
  }

  return authService.refreshCurrentUser().pipe(
    map((user) => allowUserSite(user, adminUrl)),
    catchError(() => of(adminUrl)),
  );
};

export const userGuard: CanActivateFn = () => {
  return checkUserAccess();
};

export const userMatchGuard: CanMatchFn = () => {
  return checkUserAccess();
};
