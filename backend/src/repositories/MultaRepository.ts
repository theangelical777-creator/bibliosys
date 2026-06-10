// src/repositories/MultaRepository.ts
import { PrismaClient, Multa } from '@prisma/client';

export interface IMultaRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByUsuarioId(usuarioId: string): Promise<any[]>;
  create(data: Omit<Multa, 'id'>): Promise<Multa>;
  update(id: string, data: Partial<Multa>): Promise<Multa>;
}

export class MultaRepository implements IMultaRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.multa.findMany({
      include: {
        usuario: { select: { nombre: true, email: true, tipo: true } },
        prestamo: { include: { libro: true } }
      },
      orderBy: { estado: 'asc' } // Mostrar pendientes primero
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.multa.findUnique({
      where: { id },
      include: { usuario: true, prestamo: true }
    });
  }

  async findByUsuarioId(usuarioId: string): Promise<any[]> {
    return this.prisma.multa.findMany({
      where: { usuarioId },
      include: { prestamo: { include: { libro: true } } },
      orderBy: { estado: 'asc' }
    });
  }

  async create(data: Omit<Multa, 'id'>): Promise<Multa> {
    return this.prisma.multa.create({
      data
    });
  }

  async update(id: string, data: Partial<Multa>): Promise<Multa> {
    return this.prisma.multa.update({
      where: { id },
      data
    });
  }
}
