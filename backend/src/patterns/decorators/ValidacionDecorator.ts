// src/patterns/decorators/ValidacionDecorator.ts

export interface PrestamoContextParams {
  usuarioId: string;
  libroId: string;
  usuarioTipo: string;
  usuarioEstado: string;
  multasPendientes: number;
  prestamosActivosCount: number;
  libroStockDisponible: number;
  libroEstado: string;
}

export interface PrestamoProcessor {
  validar(params: PrestamoContextParams): void;
}

export class BasePrestamoProcessor implements PrestamoProcessor {
  validar(params: PrestamoContextParams): void {
    // Proceso base: todo está bien si pasa por aquí sin decorators
  }
}

export abstract class PrestamoProcessorDecorator implements PrestamoProcessor {
  protected component: PrestamoProcessor;

  constructor(component: PrestamoProcessor) {
    this.component = component;
  }

  validar(params: PrestamoContextParams): void {
    this.component.validar(params);
  }
}

export class ValidacionLimiteDecorator extends PrestamoProcessorDecorator {
  private limites: Record<string, number> = {
    estudiante: 3,
    profesor: 10,
    visitante: 1,
  };

  validar(params: PrestamoContextParams): void {
    super.validar(params);
    const tipo = params.usuarioTipo.toLowerCase();
    const limite = this.limites[tipo] || 1;
    if (params.prestamosActivosCount >= limite) {
      throw new Error(`[Decorator: Límite] El usuario ha alcanzado su límite de préstamos (${limite})`);
    }
  }
}

export class ValidacionMultaDecorator extends PrestamoProcessorDecorator {
  validar(params: PrestamoContextParams): void {
    super.validar(params);
    if (params.multasPendientes > 200) {
      throw new Error(`[Decorator: Multas] El usuario está suspendido por multas acumuladas de RD$${params.multasPendientes}`);
    }
    if (params.usuarioEstado === 'suspendido') {
      throw new Error(`[Decorator: Multas] El usuario tiene su cuenta suspendida`);
    }
  }
}

export class ValidacionDisponibilidadDecorator extends PrestamoProcessorDecorator {
  validar(params: PrestamoContextParams): void {
    super.validar(params);
    if (params.libroStockDisponible <= 0 || params.libroEstado === 'agotado') {
      throw new Error(`[Decorator: Stock] El libro no cuenta con stock disponible para préstamo`);
    }
    if (params.libroEstado === 'de_baja') {
      throw new Error(`[Decorator: Stock] El libro ha sido retirado (dado de baja) de la biblioteca`);
    }
  }
}
