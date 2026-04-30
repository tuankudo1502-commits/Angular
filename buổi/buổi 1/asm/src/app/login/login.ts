import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private returnUrl: string = '/';

  loginData = {
    email: '',
    password: '',
    rememberMe: false,
  };

  isLoading = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  onSubmit() {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';

    const email = this.loginData.email.trim().toLowerCase();
    const password = this.loginData.password;

    if (!email || !password) {
      this.errorMessage = 'Vui lòng nhập đầy đủ email và mật khẩu';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Email không hợp lệ';
      return;
    }

    this.isLoading = true;

    this.authService
      .login({
        email,
        password,
      }, this.loginData.rememberMe)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.isLoading = false;

            if (response.user.role === 'admin') {
              setTimeout(() => {
                void this.router.navigateByUrl('/admin/dashboard');
              }, 0);
            } else {
              const target = this.returnUrl.startsWith('/admin') ? '/' : this.returnUrl;
              setTimeout(() => {
                void this.router.navigateByUrl(target).catch(() => {
                  this.errorMessage = 'Không thể chuyển trang sau đăng nhập';
                });
              }, 0);
            }
            return;
          }

          this.errorMessage = 'Email hoặc mật khẩu không đúng';
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Không thể kết nối máy chủ, vui lòng thử lại';
        },
      });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle() {
    this.errorMessage = 'Tính năng đang phát triển. Vui lòng đăng nhập bằng email.';
  }

  loginWithFacebook() {
    this.errorMessage = 'Tính năng đang phát triển. Vui lòng đăng nhập bằng email.';
  }
}
