import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm = new FormGroup({ //đăng ký form
    username: new FormControl('lửa'), //tạo input username
    password: new FormControl('123'), //tạo input password
  });
  constructor(private userService: UserService){}

  login() {
    let a = this.loginForm.value; //lấy giá trị của form
    this.userService.login(a.username, a.password).subscribe(users => {
      if(users.length > 0) {
        console.log(users);
        alert('Đăng nhập thành công');
      } else {
        alert('Đăng nhập thất bại');
      }
    })
  }
}
