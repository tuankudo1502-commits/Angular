import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, Observable, of } from 'rxjs';
import { adminGuard } from './admin.guard';
import { AuthService, User } from '../services/auth.service';

class AuthServiceMock {
  token: string | null = null;
  currentUser: User | null = null;
  refreshResult: Observable<User | null> = of(null);

  getToken(): string | null {
    return this.token;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  refreshCurrentUser(): Observable<User | null> {
    return this.refreshResult;
  }
}

describe('adminGuard', () => {
  let authServiceMock: AuthServiceMock;
  let router: Router;

  beforeEach(() => {
    authServiceMock = new AuthServiceMock();

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  const runGuard = async (): Promise<unknown> => {
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, [] as never));
    if (isObservable(result)) {
      return firstValueFrom(result);
    }

    if (result instanceof Promise) {
      return await result;
    }

    return result;
  };

  it('redirects to login when there is no token', async () => {
    const result = await runGuard();

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2F');
  });

  it('allows access for current admin user', async () => {
    authServiceMock.token = 'token';
    authServiceMock.currentUser = {
      id: '1',
      name: 'Admin',
      email: 'admin@example.com',
      avatar: 'avatar',
      role: 'admin',
    };

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirects non-admin user to login', async () => {
    authServiceMock.token = 'token';
    authServiceMock.currentUser = {
      id: '2',
      name: 'User',
      email: 'user@example.com',
      avatar: 'avatar',
      role: 'user',
    };

    const result = await runGuard();

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2F');
  });
});
