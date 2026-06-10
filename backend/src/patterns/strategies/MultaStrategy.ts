// src/patterns/strategies/MultaStrategy.ts
import { BibliotecaConfig } from '../../config/BibliotecaConfig';

export interface MultaStrategy {
  calcularMulta(diasRetraso: number): number;
}

export class MultaEstudianteStrategy implements MultaStrategy {
  calcularMulta(diasRetraso: number): number {
    const config = BibliotecaConfig.getInstance();
    const rate = config.multas.estudiante || 5;
    return diasRetraso * rate;
  }
}

export class MultaProfesorStrategy implements MultaStrategy {
  calcularMulta(diasRetraso: number): number {
    // Exento los primeros 5 días. Luego RD$10 por día adicional.
    if (diasRetraso <= 5) {
      return 0;
    }
    const diasExcedidos = diasRetraso - 5;
    return diasExcedidos * 10; // RD$10 por día de retraso excedido
  }
}

export class MultaVisitanteStrategy implements MultaStrategy {
  calcularMulta(diasRetraso: number): number {
    const config = BibliotecaConfig.getInstance();
    const rate = config.multas.visitante || 15;
    return diasRetraso * rate;
  }
}

export class MultaContext {
  private strategy: MultaStrategy;

  constructor(strategy: MultaStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: MultaStrategy) {
    this.strategy = strategy;
  }

  calcular(diasRetraso: number): number {
    if (diasRetraso <= 0) return 0;
    return this.strategy.calcularMulta(diasRetraso);
  }
}

export class MultaStrategyFactory {
  static getStrategy(tipoUsuario: string): MultaStrategy {
    switch (tipoUsuario.toLowerCase()) {
      case 'estudiante':
        return new MultaEstudianteStrategy();
      case 'profesor':
        return new MultaProfesorStrategy();
      case 'visitante':
        return new MultaVisitanteStrategy();
      default:
        // Por defecto fallback a visitante (más restrictiva) o estudiante
        return new MultaEstudianteStrategy();
    }
  }
}
