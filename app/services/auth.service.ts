import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    const user = storedUser ? JSON.parse(storedUser) : null;
    
    console.log('🔍 AuthService inicializado');
    console.log('   Usuario en localStorage:', user ? user.username : 'ninguno');
    
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Registrar un nuevo usuario
   */
  register(userData: any): Observable<User> {
    console.log('📝 AuthService: Registrando nuevo usuario:', userData.username);
    
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      map(response => {
        console.log('✅ Usuario registrado exitosamente');
        return response.user || response;
      }),
      catchError(error => {
        console.error('❌ Error al registrar:', error);
        throw error;
      })
    );
  }

  /**
   * Iniciar sesión
   */
  login(username: string, password: string): Observable<User> {
    console.log('🔐 AuthService: Iniciando sesión para usuario:', username);
    
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      map(response => {
        console.log('✅ Login exitoso');
        
        const user = response.user || response;
        
        if (user && user.token) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          console.log('💾 Usuario guardado en localStorage');
          console.log('   ID:', user.id);
          console.log('   Username:', user.username);
          console.log('   Role:', user.role || 'user');
          console.log('   Token:', user.token.substring(0, 20) + '...');
        }
        
        this.currentUserSubject.next(user);
        
        return user;
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        throw error;
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    console.log('👋 AuthService: Cerrando sesión');
    
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    
    console.log('✅ Sesión cerrada');
  }

  /**
   * Obtener el perfil del usuario autenticado
   */
  getProfile(): Observable<User> {
    console.log('👤 AuthService: Obteniendo perfil del usuario actual');
    
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      map(user => {
        console.log('✅ Perfil obtenido:', user.username);
        return user;
      }),
      catchError(error => {
        console.error('❌ Error al obtener perfil:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar datos del usuario
   */
  updateUser(userId: number, userData: any): Observable<User> {
    console.log(`✏️ AuthService: Actualizando usuario ID ${userId}`);
    console.log('   Datos a actualizar:', userData);
    
    return this.http.put<any>(`${this.apiUrl}/${userId}`, userData).pipe(
      map(response => {
        console.log('✅ Usuario actualizado exitosamente');
        
        const user = response.user || response;
        
        if (user.token) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          console.log('💾 Usuario actualizado en localStorage');
        }
        
        this.currentUserSubject.next(user);
        
        return user;
      }),
      catchError(error => {
        console.error('❌ Error al actualizar usuario:', error);
        throw error;
      })
    );
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    const isAuth = !!(user && user.token);
    
    console.log(`🔍 Verificando autenticación: ${isAuth ? 'Sí' : 'No'}`);
    
    return isAuth;
  }

  /**
   * Método alternativo: isLoggedIn (alias de isAuthenticated)
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Obtener el token del usuario actual
   */
  getToken(): string | null {
    const token = this.currentUserValue?.token || null;
    
    if (token) {
      console.log(`🔐 Token disponible: ${token.substring(0, 20)}...`);
    } else {
      console.warn(`⚠️ No hay token disponible`);
    }
    
    return token;
  }

  /**
   * Verificar si el usuario actual es admin
   */
  isAdmin(): boolean {
    const user = this.currentUserValue;
    const isAdmin = !!(user && user.role === 'admin');
    
    console.log(`👑 ¿Es admin?: ${isAdmin ? 'Sí' : 'No'}`);
    
    return isAdmin;
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserValue;
  }
}