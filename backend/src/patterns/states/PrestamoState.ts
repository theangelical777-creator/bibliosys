// src/patterns/states/PrestamoState.ts

export interface PrestamoEntity {
  id: string;
  libroId: string;
  usuarioId: string;
  fechaPrestamo: Date;
  fechaVencimiento: Date;
  fechaDevolucion: Date | null;
  estado: string;
  renovaciones: number;
}

export interface PrestamoContext {
  prestamo: PrestamoEntity;
  setEstado(estado: string): Promise<void>;
  saveDevolucion(fecha: Date): Promise<void>;
  saveRenovacion(nuevaVencimiento: Date, renovaciones: number): Promise<void>;
}

export interface PrestamoState {
  renovar(context: PrestamoContext, nuevaFechaVencimiento: Date, maxRenovaciones: number): Promise<void>;
  devolver(context: PrestamoContext, fechaDevolucion: Date): Promise<void>;
  vencer(context: PrestamoContext): Promise<void>;
  getEstadoName(): string;
}

export class ActivoState implements PrestamoState {
  getEstadoName(): string {
    return 'activo';
  }

  async renovar(context: PrestamoContext, nuevaFechaVencimiento: Date, maxRenovaciones: number): Promise<void> {
    if (context.prestamo.renovaciones >= maxRenovaciones) {
      throw new Error(`Excede el límite máximo de renovaciones permitidas (${maxRenovaciones}).`);
    }
    const nuevasRenovaciones = context.prestamo.renovaciones + 1;
    await context.saveRenovacion(nuevaFechaVencimiento, nuevasRenovaciones);
    await context.setEstado('renovado');
  }

  async devolver(context: PrestamoContext, fechaDevolucion: Date): Promise<void> {
    await context.saveDevolucion(fechaDevolucion);
    await context.setEstado('devuelto');
  }

  async vencer(context: PrestamoContext): Promise<void> {
    await context.setEstado('vencido');
  }
}

export class RenovadoState implements PrestamoState {
  getEstadoName(): string {
    return 'renovado';
  }

  async renovar(context: PrestamoContext, nuevaFechaVencimiento: Date, maxRenovaciones: number): Promise<void> {
    if (context.prestamo.renovaciones >= maxRenovaciones) {
      throw new Error(`Excede el límite máximo de renovaciones permitidas (${maxRenovaciones}).`);
    }
    const nuevasRenovaciones = context.prestamo.renovaciones + 1;
    await context.saveRenovacion(nuevaFechaVencimiento, nuevasRenovaciones);
  }

  async devolver(context: PrestamoContext, fechaDevolucion: Date): Promise<void> {
    await context.saveDevolucion(fechaDevolucion);
    await context.setEstado('devuelto');
  }

  async vencer(context: PrestamoContext): Promise<void> {
    await context.setEstado('vencido');
  }
}

export class VencidoState implements PrestamoState {
  getEstadoName(): string {
    return 'vencido';
  }

  async renovar(context: PrestamoContext, nuevaFechaVencimiento: Date, maxRenovaciones: number): Promise<void> {
    throw new Error('No se puede renovar un préstamo que ya se encuentra vencido. Debe saldar su estado.');
  }

  async devolver(context: PrestamoContext, fechaDevolucion: Date): Promise<void> {
    await context.saveDevolucion(fechaDevolucion);
    await context.setEstado('devuelto');
  }

  async vencer(context: PrestamoContext): Promise<void> {
    // Ya está vencido, no hace nada
  }
}

export class DevueltoState implements PrestamoState {
  getEstadoName(): string {
    return 'devuelto';
  }

  async renovar(context: PrestamoContext, nuevaFechaVencimiento: Date, maxRenovaciones: number): Promise<void> {
    throw new Error('No se puede renovar un préstamo que ya ha sido devuelto.');
  }

  async devolver(context: PrestamoContext, fechaDevolucion: Date): Promise<void> {
    throw new Error('El préstamo ya ha sido devuelto previamente.');
  }

  async vencer(context: PrestamoContext): Promise<void> {
    throw new Error('No se puede marcar como vencido un préstamo que ya ha sido devuelto.');
  }
}

export class PendienteState implements PrestamoState {
  getEstadoName(): string {
    return 'pendiente';
  }

  async renovar(context: PrestamoContext, nuevaFechaVencimiento: Date, maxRenovaciones: number): Promise<void> {
    throw new Error('El préstamo está pendiente de retiro y no puede ser renovado.');
  }

  async devolver(context: PrestamoContext, fechaDevolucion: Date): Promise<void> {
    throw new Error('El préstamo está pendiente de retiro y no se puede devolver.');
  }

  async vencer(context: PrestamoContext): Promise<void> {
    throw new Error('El préstamo está pendiente de retiro y no se puede vencer.');
  }
}

export class PrestamoStateFactory {
  static getState(estadoName: string): PrestamoState {
    switch (estadoName.toLowerCase()) {
      case 'activo':
        return new ActivoState();
      case 'renovado':
        return new RenovadoState();
      case 'vencido':
        return new VencidoState();
      case 'devuelto':
        return new DevueltoState();
      case 'pendiente':
        return new PendienteState();
      default:
        throw new Error(`Estado de préstamo desconocido: ${estadoName}`);
    }
  }
}
