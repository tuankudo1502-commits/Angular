import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerData = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    receiveNews: false,
  };

  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';

  errors = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: '',
  };

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  validateForm(): boolean {
    let isValid = true;

    this.errors = {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeTerms: '',
    };

    if (!this.registerData.fullName.trim()) {
      this.errors.fullName = 'Vui lòng nhập họ và tên';
      isValid = false;
    } else if (this.registerData.fullName.trim().length < 3) {
      this.errors.fullName = 'Họ và tên phải có ít nhất 3 ký tự';
      isValid = false;
    }

    if (!this.registerData.email) {
      this.errors.email = 'Vui lòng nhập email';
      isValid = false;
    } else if (!this.isValidEmail(this.registerData.email)) {
      this.errors.email = 'Email không hợp lệ';
      isValid = false;
    }

    if (!this.registerData.phone) {
      this.errors.phone = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (!this.isValidPhone(this.registerData.phone)) {
      this.errors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
      isValid = false;
    }

    if (!this.registerData.password) {
      this.errors.password = 'Vui lòng nhập mật khẩu';
      isValid = false;
    } else if (this.registerData.password.length < 6) {
      this.errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    } else if (!this.isStrongPassword(this.registerData.password)) {
      this.errors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
      isValid = false;
    }

    if (!this.registerData.confirmPassword) {
      this.errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      isValid = false;
    } else if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    if (!this.registerData.agreeTerms) {
      this.errors.agreeTerms = 'Vui lòng đồng ý với điều khoản sử dụng';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  }

  isStrongPassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
  }

  onSubmit() {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    this.authService
      .register({
        name: this.registerData.fullName.trim(),
        email: this.registerData.email.trim().toLowerCase(),
        phone: this.registerData.phone.trim(),
        password: this.registerData.password,
      })
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Đăng ký thành công! Đang chuyển hướng đến trang chủ...';

            setTimeout(() => {
              void this.router.navigateByUrl('/');
            }, 1500);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        },
      });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  checkPasswordStrength(): string {
    const password = this.registerData.password;
    if (!password) return '';

    if (password.length < 6) return 'weak';
    if (this.isStrongPassword(password) && password.length >= 8) return 'strong';
    if (password.length >= 6) return 'medium';
    return 'weak';
  }

  getPasswordStrengthText(): string {
    const strength = this.checkPasswordStrength();
    switch (strength) {
      case 'weak':
        return 'Yếu';
      case 'medium':
        return 'Trung bình';
      case 'strong':
        return 'Mạnh';
      default:
        return '';
    }
  }

  loginWithGoogle() {
    this.errorMessage = 'Tính năng đang phát triển. Vui lòng đăng ký bằng email.';
  }

  loginWithFacebook() {
    this.errorMessage = 'Tính năng đang phát triển. Vui lòng đăng ký bằng email.';
  }
}
