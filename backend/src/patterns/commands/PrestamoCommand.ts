// src/patterns/commands/PrestamoCommand.ts
import { PrismaClient } from '@prisma/client';
import { PrestamoBuilder } from '../builders/PrestamoBuilder';
import { ValidacionChainBuilder } from '../chains/ValidacionChain';

export interface Command {
  execute(): Promise<any>;
  undo(): Promise<void>;
  getName(): string;
  getDetails(): string;
}

export class RealizarPrestamoCommand implements Command {
  private prisma: PrismaClient;
  private usuarioId: string;
  private libroId: string;
  private fechaVencimiento: Date;
  private nota?: string;
  
  // Guardado para poder hacer Undo
  private prestamoCreadoId?: string;

  constructor(prisma: PrismaClient, usuarioId: string, libroId: string, fechaVencimiento: Date, nota?: string) {
    this.prisma = prisma;
    this.usuarioId = usuarioId;
    this.libroId = libroId;
    this.fechaVencimiento = fechaVencimiento;
    this.nota = nota;
  }

  getName(): string {
    return 'REALIZAR_PRESTAMO';
  }

  getDetails(): string {
    return `Préstamo del libro (${this.libroId}) al socio (${this.usuarioId}). Vence: ${this.fechaVencimiento.toLocaleDateString()}`;
  }

  async execute(): Promise<any> {
    // 1. Obtener datos para la validación
    const usuario = await this.prisma.usuario.findUnique({ where: { id: this.usuarioId } });
    const libro = await this.prisma.libro.findUnique({ where: { id: this.libroId } });

    if (!usuario) throw new Error('Usuario no encontrado');
    if (!libro) throw new Error('Libro no encontrado');

    const prestamosActivosCount = await this.prisma.prestamo.count({
      where: {
        usuarioId: this.usuarioId,
        estado: { in: ['activo', 'renovado', 'vencido'] }
      }
    });

    // 2. Correr la Chain of Responsibility
    const chain = ValidacionChainBuilder.buildDefaultChain();
    await chain.handle({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        estado: usuario.estado,
        tipo: usuario.tipo,
        multasPendientes: usuario.multasPendientes
      },
      libro: {
        id: libro.id,
        titulo: libro.titulo,
        stockDisponible: libro.stockDisponible,
        estado: libro.estado
      },
      prestamosActivosCount
    });

    // 3. Crear préstamo usando Builder
    const prestamoData = new PrestamoBuilder()
      .setUsuario(this.usuarioId)
      .setLibro(this.libroId)
      .setFechaVencimiento(this.fechaVencimiento)
      .setNota(this.nota || '')
      .setEstado('activo')
      .build();

    // Iniciar transacción de base de datos
    const result = await this.prisma.$transaction(async (tx) => {
      // Registrar el préstamo
      const nuevoPrestamo = await tx.prestamo.create({
        data: prestamoData
      });

      // Reducir stock
      const nuevoStock = libro.stockDisponible - 1;
      await tx.libro.update({
        where: { id: this.libroId },
        data: {
          stockDisponible: nuevoStock,
          estado: nuevoStock <= 0 ? 'agotado' : libro.estado
        }
      });

      return nuevoPrestamo;
    });

    this.prestamoCreadoId = result.id;
    return result;
  }

  async undo(): Promise<void> {
    if (!this.prestamoCreadoId) {
      throw new Error('No se puede deshacer un comando que no ha sido ejecutado exitosamente.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Eliminar préstamo
      await tx.prestamo.delete({
        where: { id: this.prestamoCreadoId }
      });

      // 2. Incrementar stock
      const libro = await tx.libro.findUnique({ where: { id: this.libroId } });
      if (libro) {
        const nuevoStock = libro.stockDisponible + 1;
        await tx.libro.update({
          where: { id: this.libroId },
          data: {
            stockDisponible: nuevoStock,
            estado: nuevoStock > 0 ? 'disponible' : libro.estado
          }
        });
      }
    });

    console.log(`[Command: Undo] Préstamo deshacido correctamente. Préstamo ID: ${this.prestamoCreadoId}`);
  }
}

// Historial del patrón Command (Invoker)
export class CommandInvoker {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async runCommand(command: Command): Promise<any> {
    const res = await command.execute();
    
    // Registrar el comando en la tabla LogAccion de auditoría
    await this.prisma.logAccion.create({
      data: {
        commandName: command.getName(),
        details: command.getDetails(),
        undoData: JSON.stringify({
          // Guardamos los parámetros necesarios para reconstruir el comando y ejecutar su undo()
          commandClass: command.constructor.name,
          commandArgs: (command as any).prestamoCreadoId ? { prestamoId: (command as any).prestamoCreadoId, libroId: (command as any).libroId } : null
        })
      }
    });

    return res;
  }

  async revertirUltimaAccion(): Promise<string> {
    // Buscar la última acción de tipo REALIZAR_PRESTAMO que no esté reversada
    const ultimoLog = await this.prisma.logAccion.findFirst({
      where: {
        commandName: 'REALIZAR_PRESTAMO',
        reversado: false
      },
      orderBy: {
        fecha: 'desc'
      }
    });

    if (!ultimoLog) {
      throw new Error('No hay préstamos recientes que se puedan deshacer.');
    }

    const data = JSON.parse(ultimoLog.undoData);
    if (!data.commandArgs || !data.commandArgs.prestamoId) {
      throw new Error('Los datos de reversión no son válidos.');
    }

    const { prestamoId, libroId } = data.commandArgs;

    // Ejecutar la lógica de reversión directamente en la base de datos
    await this.prisma.$transaction(async (tx) => {
      // Verificar si el préstamo aún existe y si no ha sido devuelto
      const prestamo = await tx.prestamo.findUnique({ where: { id: prestamoId } });
      if (!prestamo) {
        throw new Error('El préstamo ya no existe en el sistema.');
      }
      if (prestamo.estado === 'devuelto') {
        throw new Error('No se puede deshacer un préstamo que ya ha sido devuelto por el usuario.');
      }

      // Eliminar el préstamo
      await tx.prestamo.delete({ where: { id: prestamoId } });

      // Restaurar el stock del libro
      const libro = await tx.libro.findUnique({ where: { id: libroId } });
      if (libro) {
        const nuevoStock = libro.stockDisponible + 1;
        await tx.libro.update({
          where: { id: libroId },
          data: {
            stockDisponible: nuevoStock,
            estado: 'disponible'
          }
        });
      }

      // Marcar el log de acción como reversado
      await tx.logAccion.update({
        where: { id: ultimoLog.id },
        data: { reversado: true }
      });
    });

    return `Préstamo del libro revertido exitosamente. Detalles de la acción: ${ultimoLog.details}`;
  }
}
