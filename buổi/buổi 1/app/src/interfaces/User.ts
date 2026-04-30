export default interface User {
  id: number|string;
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: string; //'admin' | 'user' | 'guest' | 'employee' | 'shopper'
}