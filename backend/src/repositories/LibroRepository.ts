// src/repositories/LibroRepository.ts
import { PrismaClient, Libro } from '@prisma/client';

export interface ILibroRepository {
  findAll(): Promise<Libro[]>;
  findById(id: string): Promise<Libro | null>;
  findByIsbn(isbn: string): Promise<Libro | null>;
  create(data: Omit<Libro, 'id'>): Promise<Libro>;
  update(id: string, data: Partial<Libro>): Promise<Libro>;
  delete(id: string): Promise<Libro>;
  search(query: string): Promise<Libro[]>;
}

export class LibroRepository implements ILibroRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findAll(): Promise<Libro[]> {
    return this.prisma.libro.findMany();
  }

  async findById(id: string): Promise<Libro | null> {
    return this.prisma.libro.findUnique({
      where: { id }
    });
  }

  async findByIsbn(isbn: string): Promise<Libro | null> {
    return this.prisma.libro.findUnique({
      where: { isbn }
    });
  }

  async create(data: Omit<Libro, 'id'>): Promise<Libro> {
    return this.prisma.libro.create({
      data
    });
  }

  async update(id: string, data: Partial<Libro>): Promise<Libro> {
    return this.prisma.libro.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Libro> {
    return this.prisma.libro.delete({
      where: { id }
    });
  }

  async search(query: string): Promise<Libro[]> {
    return this.prisma.libro.findMany({
      where: {
        OR: [
          { titulo: { contains: query } },
          { autor: { contains: query } },
          { categoria: { contains: query } },
          { isbn: { contains: query } }
        ]
      }
    });
  }
}
