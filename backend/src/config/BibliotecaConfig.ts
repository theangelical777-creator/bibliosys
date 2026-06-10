// src/config/BibliotecaConfig.ts
export class BibliotecaConfig {
  private static instancia: BibliotecaConfig

  readonly diasGracia = 3
  readonly maxRenovaciones = 2
  readonly multaSuspension = 200

  readonly plazos: Record<string, number> = {
    estudiante: 15,
    profesor: 60,
    visitante: 7,
  }

  readonly limites: Record<string, number> = {
    estudiante: 3,
    profesor: 10,
    visitante: 1,
  }

  readonly multas: Record<string, number> = {
    estudiante: 5,   // RD$5 por día
    profesor: 0,     // Exento los primeros 5 días, luego calculable (o exento si se define)
    visitante: 15,   // RD$15 por día
  }

  private constructor() {}

  static getInstance(): BibliotecaConfig {
    if (!this.instancia) {
      this.instancia = new BibliotecaConfig()
    }
    return this.instancia
  }
}
