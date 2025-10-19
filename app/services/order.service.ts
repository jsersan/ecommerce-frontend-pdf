// src/app/services/order.service.ts - VERSIÓN CORREGIDA

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Order, OrderBackend, OrderDetail, OrderUtils } from '../models/order';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/pedidos`;
  private readonly REQUEST_TIMEOUT = 10000; // 10 segundos timeout

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🔧 OrderService inicializado');
    console.log('📍 API URL:', this.apiUrl);
  }

  /**
   * Obtener headers con autenticación JWT
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return headers;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  private checkAuthentication(): boolean {
    if (!this.authService.isLoggedIn()) {
      console.error('❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
    }
    return true;
  }

  /**
   * ✅ CORREGIDO: Obtener pedidos del usuario actual
   * Ahora retorna Observable en lugar de lanzar error
   */
  getUserOrders(): Observable<Order[]> {
    console.log('🚀 Obteniendo pedidos del usuario actual');
    
    try {
      this.checkAuthentication();
    } catch (err) {
      console.error('❌ Error de autenticación:', err);
      return throwError(() => new Error('Usuario no autenticado o sin ID'));
    }

    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser || !currentUser.id) {
      console.error('❌ No hay usuario actual o sin ID');
      return throwError(() => new Error('Usuario no autenticado o sin ID válido'));
    }

    console.log('✅ Obteniendo pedidos para usuario ID:', currentUser.id);
    return this.getOrders({ userId: currentUser.id });
  }

  /**
   * Obtener todos los pedidos de un usuario específico por su ID
   */
  getOrders({ userId }: { userId: number }): Observable<Order[]> {
    console.log('🚀 Obteniendo pedidos para usuario:', userId);
    
    try {
      this.checkAuthentication();
    } catch (err) {
      return throwError(() => err);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.get<OrderBackend[]>(`${this.apiUrl}/user/${userId}`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        map(ordersBackend => {
          console.log('📦 Pedidos recibidos del servidor:', ordersBackend.length);
          return ordersBackend.map(orderBackend => 
            OrderUtils.fromBackendFormat(orderBackend)
          );
        }),
        catchError(this.handleError('obtener pedidos'))
      );
  }

  /**
   * Obtener un pedido específico por su ID
   */
  getOrder(id: number): Observable<OrderDetail> {
    console.log('🚀 Obteniendo pedido con ID:', id);
    
    try {
      this.checkAuthentication();
    } catch (err) {
      return throwError(() => err);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.get<OrderDetail>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError('obtener pedido'))
      );
  }

  /**
   * Crear un nuevo pedido
   */
  createOrder(order: Order): Observable<Order> {
    console.log('🚀 Creando nuevo pedido:', order);
    
    try {
      this.checkAuthentication();
    } catch (err) {
      return throwError(() => err);
    }

    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser || !currentUser.id) {
      console.error('❌ No hay usuario actual disponible o sin ID');
      return throwError(() => new Error('Usuario no autenticado o sin ID válido'));
    }

    const validation = OrderUtils.validateOrder(order);
    if (!validation.valid) {
      console.error('❌ Pedido inválido:', validation.errors);
      return throwError(() => new Error(`Pedido inválido: ${validation.errors.join(', ')}`));
    }

    const orderBackendData = {
      iduser: currentUser.id,
      fecha: new Date().toISOString().split('T')[0],
      total: order.total,
      lineas: order.lineas?.map(line => ({
        idprod: line.idprod,
        color: line.color || 'Estándar',
        cant: line.cantidad,
        nombre: line.nombre || ''
      })) || []
    };

    console.log('📦 Datos del pedido a enviar:', orderBackendData);

    const headers = this.getAuthHeaders();
    
    return this.http.post<OrderBackend>(this.apiUrl, orderBackendData, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        map(responseBackend => {
          console.log('✅ Respuesta del servidor:', responseBackend);
          return OrderUtils.fromBackendFormat(responseBackend);
        }),
        catchError(this.handleError('crear pedido'))
      );
  }

  /**
   * Alias para getOrder (mejor nombre)
   */
  getOrderById(orderId: number): Observable<OrderDetail> {
    return this.getOrder(orderId);
  }

  /**
   * Cancelar un pedido
   */
  cancelOrder(orderId: number): Observable<any> {
    console.log('🚀 Cancelando pedido:', orderId);
    
    try {
      this.checkAuthentication();
    } catch (err) {
      return throwError(() => err);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.patch(`${this.apiUrl}/${orderId}/cancel`, {}, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError('cancelar pedido'))
      );
  }

  /**
   * Actualizar estado de un pedido (admin)
   */
  updateOrderStatus(orderId: number, status: string): Observable<any> {
    console.log('🚀 Actualizando estado del pedido:', orderId, 'a:', status);
    
    try {
      this.checkAuthentication();
    } catch (err) {
      return throwError(() => err);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.patch(`${this.apiUrl}/${orderId}/status`, { status }, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError('actualizar estado del pedido'))
      );
  }

  /**
   * Obtener resumen de pedidos del usuario
   */
  getOrdersSummary(): Observable<any> {
    console.log('🚀 Obteniendo resumen de pedidos del usuario actual');
    
    try {
      this.checkAuthentication();
    } catch (err) {
      return throwError(() => err);
    }

    const headers = this.getAuthHeaders();
    
    return this.http.get(`${this.apiUrl}/summary`, { headers })
      .pipe(
        timeout(this.REQUEST_TIMEOUT),
        catchError(this.handleError('obtener resumen de pedidos'))
      );
  }

  /**
   * ✅ MEJORADO: Manejo de errores más robusto
   */
  private handleError(operation = 'operation') {
    return (error: HttpErrorResponse | any): Observable<never> => {
      console.error(`❌ Error en ${operation}:`, error);
      
      let userMessage = 'Ha ocurrido un error inesperado';
      
      if (error.name === 'TimeoutError') {
        userMessage = 'La solicitud tardó demasiado. Intenta nuevamente.';
        console.error('⏱️ Timeout en:', operation);
      } else if (error.error instanceof ErrorEvent) {
        console.error('🖥️ Error del cliente:', error.error.message);
        userMessage = 'Error de conexión. Verifica tu internet.';
      } else {
        console.error(`📥 Error del servidor ${error.status}:`, error.error);
        
        switch (error.status) {
          case 0:
            userMessage = 'No se puede conectar al servidor. ¿Está el backend ejecutándose?';
            console.error('🚨 CORS o servidor no accesible en:', this.apiUrl);
            break;
          case 401:
            userMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
            this.authService.logout();
            break;
          case 403:
            userMessage = 'No tienes permisos para realizar esta operación.';
            break;
          case 400:
            userMessage = error.error?.message || 'Datos inválidos enviados al servidor.';
            break;
          case 404:
            userMessage = 'Recurso no encontrado. El pedido puede que no exista.';
            break;
          case 422:
            userMessage = 'Error de validación en los datos enviados.';
            break;
          case 500:
            userMessage = 'Error interno del servidor. Inténtalo más tarde.';
            break;
          default:
            userMessage = `Error del servidor: ${error.status}. ${error.error?.message || ''}`;
        }
      }
      
      console.error('📢 Mensaje para el usuario:', userMessage);
      
      const clientError = new Error(userMessage);
      (clientError as any).originalError = error;
      (clientError as any).status = error.status;
      
      return throwError(() => clientError);
    };
  }

  /**
   * Debug info
   */
  debug(): void {
    console.log('📍 OrderService Debug:', {
      apiUrl: this.apiUrl,
      isLoggedIn: this.authService.isLoggedIn(),
      currentUser: this.authService.currentUserValue,
      hasToken: !!this.authService.getToken()
    });
  }
}