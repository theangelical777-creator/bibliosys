// src/patterns/observers/DevolucionObserver.ts
import { PrismaClient } from '@prisma/client';

export interface DevolucionEvent {
  prestamoId: string;
  libroId: string;
  usuarioId: string;
  fechaDevolucion: Date;
}

export interface DevolucionObserver {
  update(event: DevolucionEvent): Promise<void>;
}

// 1. Observer que actualiza el inventario del libro devuelto
export class InventarioDevolucionObserver implements DevolucionObserver {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async update(event: DevolucionEvent): Promise<void> {
    const libro = await this.prisma.libro.findUnique({
      where: { id: event.libroId }
    });

    if (libro) {
      const nuevoStockDisp = Math.min(libro.stockTotal, libro.stockDisponible + 1);
      const nuevoEstado = nuevoStockDisp > 0 ? 'disponible' : libro.estado;
      
      await this.prisma.libro.update({
        where: { id: event.libroId },
        data: {
          stockDisponible: nuevoStockDisp,
          estado: nuevoEstado
        }
      });
      console.log(`[Observer: Inventario] Stock actualizado para el libro "${libro.titulo}". Stock Disponible: ${nuevoStockDisp}`);
    }
  }
}

// 2. Observer que gestiona la cola de reservas de libros
export class ReservasDevolucionObserver implements DevolucionObserver {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async update(event: DevolucionEvent): Promise<void> {
    // Buscar la reserva más antigua en espera para este libro
    const reservaEspera = await this.prisma.reserva.findFirst({
      where: {
        libroId: event.libroId,
        estado: 'en_espera'
      },
      orderBy: {
        fechaReserva: 'asc'
      },
      include: {
        usuario: true,
        libro: true
      }
    });

    if (reservaEspera) {
      // Marcar la reserva como notificada para que el socio pase a retirarlo
      await this.prisma.reserva.update({
        where: { id: reservaEspera.id },
        data: { estado: 'notificado' }
      });

      console.log(`[Observer: Reservas] Socio "${reservaEspera.usuario.nombre}" notificado por disponibilidad del libro "${reservaEspera.libro.titulo}".`);
      // Aquí se simularía el envío de un correo electrónico o SMS
    }
  }
}

// 3. Observer que registra la auditoría del evento
export class AuditoriaDevolucionObserver implements DevolucionObserver {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async update(event: DevolucionEvent): Promise<void> {
    const logDetails = `Devolución de préstamo: ${event.prestamoId} por usuario: ${event.usuarioId} en fecha: ${event.fechaDevolucion.toISOString()}`;
    await this.prisma.logAccion.create({
      data: {
        commandName: 'DEVOLUCION_OBSERVER',
        details: logDetails,
        undoData: JSON.stringify({ prestamoId: event.prestamoId, libroId: event.libroId, usuarioId: event.usuarioId })
      }
    });
    console.log(`[Observer: Auditoría] Log de auditoría registrado para devolución.`);
  }
}

// Sujeto (Observable)
export class DevolucionSubject {
  private observers: DevolucionObserver[] = [];

  attach(observer: DevolucionObserver): void {
    this.observers.push(observer);
  }

  detach(observer: DevolucionObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  async notify(event: DevolucionEvent): Promise<void> {
    for (const observer of this.observers) {
      try {
        await observer.update(event);
      } catch (err) {
        console.error('Error ejecutando observer de devolución:', err);
      }
    }
  }
}
