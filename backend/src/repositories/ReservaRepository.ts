// src/repositories/ReservaRepository.ts
import { PrismaClient, Reserva } from '@prisma/client';

export interface IReservaRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByUsuarioId(usuarioId: string): Promise<any[]>;
  findByLibroId(libroId: string): Promise<any[]>;
  create(data: Omit<Reserva, 'id' | 'fechaReserva'>): Promise<Reserva>;
  update(id: string, data: Partial<Reserva>): Promise<Reserva>;
  delete(id: string): Promise<Reserva>;
}

export class ReservaRepository implements IReservaRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.reserva.findMany({
      include: {
        usuario: { select: { nombre: true, email: true } },
        libro: { select: { titulo: true, autor: true } }
      },
      orderBy: { fechaReserva: 'desc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.reserva.findUnique({
      where: { id },
      include: { usuario: true, libro: true }
    });
  }

  async findByUsuarioId(usuarioId: string): Promise<any[]> {
    return this.prisma.reserva.findMany({
      where: { usuarioId },
      include: { libro: true },
      orderBy: { fechaReserva: 'desc' }
    });
  }

  async findByLibroId(libroId: string): Promise<any[]> {
    return this.prisma.reserva.findMany({
      where: { libroId },
      include: { usuario: true },
      orderBy: { fechaReserva: 'asc' }
    });
  }

  async create(data: Omit<Reserva, 'id' | 'fechaReserva'>): Promise<Reserva> {
    return this.prisma.reserva.create({
      data
    });
  }

  async update(id: string, data: Partial<Reserva>): Promise<Reserva> {
    return this.prisma.reserva.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Reserva> {
    return this.prisma.reserva.delete({
      where: { id }
    });
  }
}
