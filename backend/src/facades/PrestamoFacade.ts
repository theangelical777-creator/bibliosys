// src/facades/PrestamoFacade.ts
import { PrismaClient } from '@prisma/client';
import { RealizarPrestamoCommand, CommandInvoker } from '../patterns/commands/PrestamoCommand';

export class PrestamoFacade {
  private prisma: PrismaClient;
  private invoker: CommandInvoker;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.invoker = new CommandInvoker(prisma);
  }

  /**
   * Fachada simplificada para realizar un préstamo.
   * Valida restricciones por Chain of Responsibility, construye el préstamo por Builder,
   * actualiza la base de datos (con transacciones) y registra en auditoría para deshacer.
   */
  async realizarPrestamo(usuarioId: string, libroId: string, fechaVencimiento: Date, nota?: string): Promise<any> {
    const command = new RealizarPrestamoCommand(this.prisma, usuarioId, libroId, fechaVencimiento, nota);
    return this.invoker.runCommand(command);
  }

  /**
   * Facilita deshacer el último préstamo registrado.
   */
  async deshacerUltimoPrestamo(): Promise<string> {
    return this.invoker.revertirUltimaAccion();
  }
}
