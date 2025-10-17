import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log(`
      🔗 JwtInterceptor: ${request.method} ${request.url}`);

    // Obtener el usuario actual del servicio de autenticación
    const currentUser = this.authService.currentUserValue;
    
    // Verificar si es una petición a la API
    const isApiUrl = request.url.startsWith(environment.apiUrl);

    console.log(`   📍 Es URL de API: ${isApiUrl}`);
    console.log(`   🔑 Usuario autenticado: ${currentUser ? 'Sí' : 'No'}`);

    // Si hay usuario y es una petición a la API, añadir el token
    if (currentUser && currentUser.token && isApiUrl) {
      console.log(`   ✅ Añadiendo token al header Authorization`);
      console.log(`   🔐 Token: ${currentUser.token.substring(0, 20)}...`);

      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      if (!currentUser) {
        console.warn(`   ⚠️ No hay usuario autenticado`);
      }
      if (!currentUser?.token) {
        console.warn(`   ⚠️ Usuario sin token`);
      }
      if (!isApiUrl) {
        console.log(`   ℹ️ No es URL de API, no se añade token`);
      }
    }

    // Continuar con la petición
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`❌ Error HTTP en interceptor:`, error);
        console.error(`   Status: ${error.status}`);
        console.error(`   Message: ${error.message}`);

        // Si es error 401, limpiar sesión
        if (error.status === 401) {
          console.error(`🔓 Token inválido o expirado, limpiando sesión`);
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }
}

