import { Routes } from '@angular/router';
import path from 'path';
import { Home } from './home/home';
import { Detail } from './detail/detail';
import { About } from './about/about';
import { Login } from './login/login';

export const routes: Routes = [
  // cấu hình routes ở đây
  // => HomeComponent
  // /about => AboutComponent
  // /details => DetailsComponent
  {path: '', component: Home},
  {path: 'detail', component: Detail},
  {path: 'about', component: About},
  {path: '**', redirectTo: ''}, // cấu hình route mặc định, nếu ko 
];
