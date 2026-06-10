// src/repositories/UsuarioRepository.ts
import { PrismaClient, Usuario } from '@prisma/client';

export interface IUsuarioRepository {
  findAll(): Promise<Usuario[]>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  create(data: Omit<Usuario, 'id' | 'fechaRegistro'>): Promise<Usuario>;
  update(id: string, data: Partial<Usuario>): Promise<Usuario>;
  delete(id: string): Promise<Usuario>;
}

export class UsuarioRepository implements IUsuarioRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({
      orderBy: { nombre: 'asc' }
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.prisma.usuario.findUnique({
      where: { email }
    });
  }

  async create(data: Omit<Usuario, 'id' | 'fechaRegistro'>): Promise<Usuario> {
    return this.prisma.usuario.create({
      data
    });
  }

  async update(id: string, data: Partial<Usuario>): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Usuario> {
    return this.prisma.usuario.delete({
      where: { id }
    });
  }
}
