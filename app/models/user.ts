export interface User {
  id: number;
  username: string;
  nombre: string;
  email: string;
  direccion: string;
  ciudad: string;
  cp: string;
  role?: string; // 'user' o 'admin'
  token?: string; // JWT Token
}