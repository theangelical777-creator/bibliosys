// src/patterns/chains/ValidacionChain.ts
import { BibliotecaConfig } from '../../config/BibliotecaConfig';

export interface ValidacionRequest {
  usuario: {
    id: string;
    nombre: string;
    estado: string;
    tipo: string;
    multasPendientes: number;
  };
  libro: {
    id: string;
    titulo: string;
    stockDisponible: number;
    estado: string;
  };
  prestamosActivosCount: number;
}

export abstract class ValidacionHandler {
  private nextHandler?: ValidacionHandler;

  setNext(handler: ValidacionHandler): ValidacionHandler {
    this.nextHandler = handler;
    return handler;
  }

  protected async next(request: ValidacionRequest): Promise<void> {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
  }

  abstract handle(request: ValidacionRequest): Promise<void>;
}

export class UsuarioActivoHandler extends ValidacionHandler {
  async handle(request: ValidacionRequest): Promise<void> {
    if (request.usuario.estado === 'suspendido') {
      throw new Error(`El usuario ${request.usuario.nombre} está SUSPENDIDO por multas o sanciones y no puede realizar préstamos.`);
    }
    if (request.usuario.estado === 'inactivo') {
      throw new Error(`El usuario ${request.usuario.nombre} está INACTIVO y no puede realizar préstamos.`);
    }
    return this.next(request);
  }
}

export class MultasPendientesHandler extends ValidacionHandler {
  async handle(request: ValidacionRequest): Promise<void> {
    const config = BibliotecaConfig.getInstance();
    const threshold = config.multaSuspension || 200;
    if (request.usuario.multasPendientes > threshold) {
      throw new Error(`El usuario tiene RD$${request.usuario.multasPendientes} en multas pendientes, excediendo el límite de RD$${threshold}. Cuenta bloqueada.`);
    }
    return this.next(request);
  }
}

export class LimitePrestamosHandler extends ValidacionHandler {
  async handle(request: ValidacionRequest): Promise<void> {
    const config = BibliotecaConfig.getInstance();
    const tipo = request.usuario.tipo.toLowerCase();
    const limite = config.limites[tipo] || 1;

    if (request.prestamosActivosCount >= limite) {
      throw new Error(`El usuario ha alcanzado su límite máximo de préstamos activos (${limite}) para el tipo '${request.usuario.tipo}'.`);
    }
    return this.next(request);
  }
}

export class StockDisponibleHandler extends ValidacionHandler {
  async handle(request: ValidacionRequest): Promise<void> {
    if (request.libro.estado === 'de_baja') {
      throw new Error(`El libro "${request.libro.titulo}" ha sido dado de baja de la biblioteca.`);
    }
    if (request.libro.stockDisponible <= 0 || request.libro.estado === 'agotado') {
      throw new Error(`No hay ejemplares disponibles para el libro "${request.libro.titulo}".`);
    }
    return this.next(request);
  }
}

export class ValidacionChainBuilder {
  static buildDefaultChain(): ValidacionHandler {
    const usuarioActivo = new UsuarioActivoHandler();
    const multasPendientes = new MultasPendientesHandler();
    const limitePrestamos = new LimitePrestamosHandler();
    const stockDisponible = new StockDisponibleHandler();

    usuarioActivo
      .setNext(multasPendientes)
      .setNext(limitePrestamos)
      .setNext(stockDisponible);

    return usuarioActivo;
  }
}
