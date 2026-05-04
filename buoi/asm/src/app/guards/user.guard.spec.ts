import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, Observable, of } from 'rxjs';
import { userGuard } from './user.guard';
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

describe('userGuard', () => {
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
    const result = TestBed.runInInjectionContext(() => userGuard({} as never, {} as never));
    if (result instanceof UrlTree || typeof result === 'boolean') {
      return result;
    }

    if (isObservable(result)) {
      return firstValueFrom(result);
    }

    if (result instanceof Promise) {
      return await result;
    }

    return result;
  };

  it('allows access when user is not logged in', async () => {
    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('allows access for logged in non-admin user', async () => {
    authServiceMock.token = 'token';
    authServiceMock.currentUser = {
      id: '2',
      name: 'User',
      email: 'user@example.com',
      avatar: 'avatar',
      role: 'user',
    };

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirects admin user to admin dashboard', async () => {
    authServiceMock.token = 'token';
    authServiceMock.currentUser = {
      id: '1',
      name: 'Admin',
      email: 'admin@example.com',
      avatar: 'avatar',
      role: 'admin',
    };

    const result = await runGuard();

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });

  it('redirects to admin dashboard when refreshed user is admin', async () => {
    authServiceMock.token = 'token';
    authServiceMock.currentUser = null;
    authServiceMock.refreshResult = of({
      id: '1',
      name: 'Admin',
      email: 'admin@example.com',
      avatar: 'avatar',
      role: 'admin',
    });

    const result = await runGuard();

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });
});
