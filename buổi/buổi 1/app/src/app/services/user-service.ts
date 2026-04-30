import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import User from '../../interfaces/User';


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'https://localhost:3000/users';
  constructor(private http: HttpClient) {}
  login(username: string, password: string) {
    return this.http.get<User[]>(`${this.apiUrl}?username=${username}&password=${password}`);
  }

  register(user: User){
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number|string, user: User){
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  getUserById(id: number|string) {
   return this.http.get<User>(`${this.apiUrl}/${id}`); 
  }

  changePassword(id: number|string, oldPassword: string,newPassword: string) {
    var user: User;
    this.getUserById(id).subscribe(u => {
      user = u;
    });
    return (user!.password !=null && user!.password === oldPassword)
  }
}
