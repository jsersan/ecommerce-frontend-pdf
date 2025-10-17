import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user'; // ✅ Importar de models, NO de auth.service

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  
  currentUser: User | null = null;
  isLoading: boolean = false;
  isEditing: boolean = false;

  // Formulario de datos
  formData = {
    username: '',
    nombre: '',
    email: '',
    direccion: '',
    ciudad: '',
    cp: '',
    password: ''
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    console.log('📄 ProfileComponent inicializado');
    
    // Obtener usuario actual
    this.loadCurrentUser();
    
    // Suscribirse a cambios del usuario
    this.authService.currentUser$.subscribe(user => {
      console.log('👤 Usuario actualizado en componente:', user?.username);
      this.currentUser = user;
      this.loadFormData();
    });
  }

  /**
   * Cargar el usuario actual
   */
  loadCurrentUser(): void {
    console.log('🔄 Cargando usuario actual...');
    
    this.currentUser = this.authService.currentUserValue;
    
    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario autenticado');
      return;
    }
    
    console.log('✅ Usuario cargado:', this.currentUser.username);
    this.loadFormData();
  }

  /**
   * Cargar datos del formulario
   */
  loadFormData(): void {
    if (this.currentUser) {
      this.formData = {
        username: this.currentUser.username,
        nombre: this.currentUser.nombre,
        email: this.currentUser.email,
        direccion: this.currentUser.direccion,
        ciudad: this.currentUser.ciudad,
        cp: this.currentUser.cp,
        password: ''
      };
      console.log('📋 Datos del formulario cargados');
    }
  }

  /**
   * Alternar modo edición
   */
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    console.log('✏️ Modo edición:', this.isEditing ? 'activado' : 'desactivado');
  }

  /**
   * Actualizar datos del usuario
   */
  updateUserData(): void {
    console.log('🔄 Actualizando datos del usuario...');
    
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    // Validar que al menos un campo esté lleno
    if (!this.formData.username || !this.formData.email) {
      alert('Usuario y email son obligatorios');
      return;
    }

    // Validar email
    if (!this.isValidEmail(this.formData.email)) {
      alert('Por favor, ingresa un email válido');
      return;
    }

    this.isLoading = true;

    // Preparar datos para enviar
    const updateData: any = {
      username: this.formData.username,
      nombre: this.formData.nombre,
      email: this.formData.email,
      direccion: this.formData.direccion,
      ciudad: this.formData.ciudad,
      cp: this.formData.cp
    };

    // Solo enviar contraseña si se proporcionó
    if (this.formData.password && this.formData.password.trim() !== '') {
      updateData.password = this.formData.password;
    }

    console.log('📤 Enviando datos actualizados:', updateData);

    this.authService.updateUser(this.currentUser.id, updateData).subscribe({
      next: (user) => {
        console.log('✅ Usuario actualizado correctamente');
        
        this.isLoading = false;
        this.isEditing = false;

        alert('Datos actualizados correctamente');

        // Limpiar contraseña del formulario
        this.formData.password = '';
      },
      error: (error) => {
        console.error('❌ Error al actualizar usuario:', error);
        
        this.isLoading = false;

        let errorMessage = 'Error al actualizar los datos';
        
        if (error.status === 401) {
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Datos inválidos';
        } else if (error.status === 0) {
          errorMessage = 'No se pudo conectar al servidor';
        }

        alert(errorMessage);
      }
    });
  }

  /**
   * Validar formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Cancelar edición
   */
  cancelEdit(): void {
    console.log('❌ Cancelando edición');
    
    this.isEditing = false;
    this.loadFormData(); // Recargar datos originales
  }
}