// src/services/NotificacionService.ts
export class NotificacionService {
  async enviarConfirmacionPrestamo(usuarioEmail: string, libroTitulo: string, fechaVencimiento: Date): Promise<void> {
    console.log(`[NOTIFICACIÓN] Enviando correo a ${usuarioEmail}: "Hola! Has tomado prestado '${libroTitulo}'. Favor devolver antes de ${fechaVencimiento.toLocaleDateString()}."`);
  }

  async enviarNotificacionDevolucion(usuarioEmail: string, libroTitulo: string): Promise<void> {
    console.log(`[NOTIFICACIÓN] Enviando correo a ${usuarioEmail}: "Hola! Hemos registrado la devolución del libro '${libroTitulo}'. ¡Gracias!"`);
  }

  async enviarNotificacionReservaDisponible(usuarioEmail: string, libroTitulo: string): Promise<void> {
    console.log(`[NOTIFICACIÓN] Enviando correo a ${usuarioEmail}: "¡Buenas noticias! El libro '${libroTitulo}' que reservaste ya está disponible. Tienes 3 días para retirarlo."`);
  }
}
