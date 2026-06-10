// src/repositories/PrestamoRepository.ts
import { PrismaClient, Prestamo } from '@prisma/client';

export interface IPrestamoRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByUsuarioId(usuarioId: string): Promise<any[]>;
  findActivosByUsuarioId(usuarioId: string): Promise<any[]>;
  create(data: Omit<Prestamo, 'id' | 'fechaPrestamo'>): Promise<Prestamo>;
  update(id: string, data: Partial<Prestamo>): Promise<Prestamo>;
}

export class PrestamoRepository implements IPrestamoRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.prestamo.findMany({
      include: {
        libro: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            tipo: true,
            estado: true
          }
        }
      },
      orderBy: { fechaPrestamo: 'desc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.prestamo.findUnique({
      where: { id },
      include: {
        libro: true,
        usuario: true
      }
    });
  }

  async findByUsuarioId(usuarioId: string): Promise<any[]> {
    return this.prisma.prestamo.findMany({
      where: { usuarioId },
      include: { libro: true },
      orderBy: { fechaPrestamo: 'desc' }
    });
  }

  async findActivosByUsuarioId(usuarioId: string): Promise<any[]> {
    return this.prisma.prestamo.findMany({
      where: {
        usuarioId,
        estado: { in: ['activo', 'renovado', 'vencido'] }
      },
      include: { libro: true }
    });
  }

  async create(data: Omit<Prestamo, 'id' | 'fechaPrestamo'>): Promise<Prestamo> {
    return this.prisma.prestamo.create({
      data
    });
  }

  async update(id: string, data: Partial<Prestamo>): Promise<Prestamo> {
    return this.prisma.prestamo.update({
      where: { id },
      data
    });
  }
}
