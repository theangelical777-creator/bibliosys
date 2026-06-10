// src/patterns/builders/PrestamoBuilder.ts

export interface PrestamoBuildTarget {
  libroId: string;
  usuarioId: string;
  fechaPrestamo: Date;
  fechaVencimiento: Date;
  estado: string;
  renovaciones: number;
  nota?: string;
}

export class PrestamoBuilder {
  private target: Partial<PrestamoBuildTarget> = {
    fechaPrestamo: new Date(),
    estado: 'activo',
    renovaciones: 0,
    nota: ''
  };

  setLibro(libroId: string): this {
    this.target.libroId = libroId;
    return this;
  }

  setUsuario(usuarioId: string): this {
    this.target.usuarioId = usuarioId;
    return this;
  }

  setFechaPrestamo(fecha: Date): this {
    this.target.fechaPrestamo = fecha;
    return this;
  }

  setFechaVencimiento(fecha: Date): this {
    this.target.fechaVencimiento = fecha;
    return this;
  }

  setEstado(estado: string): this {
    this.target.estado = estado;
    return this;
  }

  setRenovaciones(renovaciones: number): this {
    this.target.renovaciones = renovaciones;
    return this;
  }

  setNota(nota: string): this {
    this.target.nota = nota;
    return this;
  }

  build(): PrestamoBuildTarget {
    if (!this.target.libroId) {
      throw new Error('Falta el libroId para construir el Préstamo');
    }
    if (!this.target.usuarioId) {
      throw new Error('Falta el usuarioId para construir el Préstamo');
    }
    if (!this.target.fechaVencimiento) {
      throw new Error('Falta la fecha de vencimiento para construir el Préstamo');
    }

    return {
      libroId: this.target.libroId,
      usuarioId: this.target.usuarioId,
      fechaPrestamo: this.target.fechaPrestamo || new Date(),
      fechaVencimiento: this.target.fechaVencimiento,
      estado: this.target.estado || 'activo',
      renovaciones: this.target.renovaciones ?? 0,
      nota: this.target.nota || undefined
    };
  }
}
