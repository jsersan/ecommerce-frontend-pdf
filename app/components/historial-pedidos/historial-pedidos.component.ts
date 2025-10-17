import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { Subscription } from 'rxjs';

interface Pedido {
  id: number;
  fecha: Date;
  total: number;
  expanded?: boolean;
}

interface LineaPedido {
  id: number;
  idpedido: number;
  nombre: string;
  color: string;
  cantidad: number;
  precio: number;
}

@Component({
  selector: 'app-historial-pedidos',
  templateUrl: './historial-pedidos.component.html',
  styleUrls: ['./historial-pedidos.component.scss']
})
export class HistorialPedidosComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  pedidos: Pedido[] = [];
  lineasPedido: LineaPedido[] = [];
  loading: boolean = false; // ✅ Cambiar isLoading por loading
  error: string | null = null;
  private userSubscription: Subscription | null = null;

  constructor(private authService: AuthService) {
    console.log('🔧 HistorialPedidosComponent constructor');
  }

  ngOnInit(): void {
    console.log('📄 HistorialPedidosComponent inicializado');
    
    this.currentUser = this.authService.currentUserValue;
    
    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario autenticado');
      this.error = 'Por favor, inicia sesión para ver tu historial de pedidos';
      return;
    }
    
    console.log('✅ Usuario cargado:', this.currentUser.username);
    
    this.cargarPedidos();
    
    this.userSubscription = this.authService.currentUser$.subscribe((user: User | null) => {
      console.log('👤 Usuario actualizado en historial:', user?.username);
      this.currentUser = user;
      
      if (!user) {
        this.pedidos = [];
        this.error = 'Sesión cerrada. Por favor, inicia sesión nuevamente.';
      } else {
        this.cargarPedidos();
      }
    });
  }

  ngOnDestroy(): void {
    console.log('🗑️ HistorialPedidosComponent destruido');
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Cargar historial de pedidos del usuario
   */
  cargarPedidos(): void {
    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario para cargar pedidos');
      return;
    }

    this.loading = true;
    this.error = null;
    console.log('📥 Cargando historial de pedidos para usuario:', this.currentUser.id);

    try {
      // Aquí iría la lógica para obtener los pedidos del servicio
      // Por ahora, inicializamos arrays vacíos
      this.pedidos = [];
      this.lineasPedido = [];
      
      console.log('✅ Historial de pedidos cargado:', this.pedidos.length, 'pedidos');
      
      if (this.pedidos.length === 0) {
        console.log('ℹ️ El usuario no tiene pedidos aún');
      }
    } catch (err) {
      console.error('❌ Error al cargar historial:', err);
      this.error = 'Error al cargar el historial de pedidos. Por favor, intenta más tarde.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Recargar pedidos
   */
  recargarPedidos(): void {
    console.log('🔄 Recargando pedidos');
    this.cargarPedidos();
  }

  /**
   * Expandir/Contraer pedido
   */
  togglePedido(index: number): void {
    console.log('📋 Alternando pedido índice:', index);
    if (this.pedidos[index]) {
      this.pedidos[index].expanded = !this.pedidos[index].expanded;
    }
  }

  /**
   * Obtener líneas de pedido para un pedido específico
   */
  getLineasPedido(pedidoId: number): LineaPedido[] {
    return this.lineasPedido.filter(linea => linea.idpedido === pedidoId);
  }

  /**
   * Calcular precio de una línea de pedido
   */
  calcularPrecioLinea(linea: LineaPedido): number {
    return linea.precio * linea.cantidad;
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: Date): string {
    if (!fecha) return '';

    const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;

    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  /**
   * Obtener el estado de un pedido en español
   */
  getOrderStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };

    return statusMap[status] || status;
  }

  /**
   * Obtener color del estado del pedido para mostrar en UI
   */
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'warning',
      'processing': 'info',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'danger',
      'refunded': 'secondary'
    };

    return colorMap[status] || 'secondary';
  }

  /**
   * Formatear precio como moneda en euros
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  /**
   * Verificar si hay pedidos
   */
  hasPedidos(): boolean {
    return this.pedidos && this.pedidos.length > 0;
  }

  /**
   * Reintentar cargar pedidos (en caso de error)
   */
  retryLoad(): void {
    console.log('🔄 Reintentando cargar historial de pedidos');
    this.error = null;
    this.cargarPedidos();
  }

  /**
   * Descargar factura de un pedido
   */
  downloadInvoice(orderId: number): void {
    console.log('📄 Descargando factura del pedido:', orderId);
    
    const pedido = this.pedidos.find(p => p.id === orderId);
    if (pedido) {
      console.log('Descargando factura para:', pedido.id);
      // Aquí iría la lógica para descargar la factura
    }
  }

  /**
   * Rastrear pedido
   */
  trackOrder(orderId: number): void {
    console.log('🚚 Rastreando pedido:', orderId);
    
    const pedido = this.pedidos.find(p => p.id === orderId);
    if (pedido) {
      console.log('Rastreando pedido:', pedido.id);
      // Aquí iría la lógica para rastrear el pedido
    }
  }

  /**
   * Cancelar un pedido
   */
  cancelOrder(orderId: number): void {
    console.log('❌ Cancelando pedido:', orderId);
    
    const pedido = this.pedidos.find(p => p.id === orderId);
    if (pedido) {
      console.log('Cancelando pedido:', pedido.id);
      // Aquí iría la lógica para cancelar el pedido
    }
  }

  /**
   * Solicitar devolución de un pedido
   */
  requestReturn(orderId: number): void {
    console.log('🔄 Solicitando devolución del pedido:', orderId);
    
    const pedido = this.pedidos.find(p => p.id === orderId);
    if (pedido) {
      console.log('Solicitando devolución para:', pedido.id);
      // Aquí iría la lógica para solicitar la devolución
    }
  }
}