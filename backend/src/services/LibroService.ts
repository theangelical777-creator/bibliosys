// src/services/LibroService.ts
import { LibroRepository } from '../repositories/LibroRepository';
import { CatalogoExternoService } from './CatalogoExternoService';
import { Libro } from '@prisma/client';

export class LibroService {
  private repository: LibroRepository;
  private catalogoExternoService: CatalogoExternoService;

  constructor(repository: LibroRepository, catalogoExternoService: CatalogoExternoService) {
    this.repository = repository;
    this.catalogoExternoService = catalogoExternoService;
  }

  async obtenerTodos(): Promise<Libro[]> {
    return this.repository.findAll();
  }

  async obtenerPorId(id: string): Promise<Libro | null> {
    return this.repository.findById(id);
  }

  async buscarYRegistrarPorIsbn(isbn: string): Promise<Libro> {
    // 1. Validar si ya existe localmente
    const localLibro = await this.repository.findByIsbn(isbn);
    if (localLibro) {
      return localLibro;
    }

    // 2. Si no existe, usar el servicio externo + Adapter
    const internalData = await this.catalogoExternoService.buscarPorIsbn(isbn);

    // 3. Registrar localmente
    return this.repository.create(internalData);
  }

  async buscarLocales(query: string): Promise<Libro[]> {
    return this.repository.search(query);
  }

  async registrarLibroManual(data: Omit<Libro, 'id'>): Promise<Libro> {
    const existe = await this.repository.findByIsbn(data.isbn);
    if (existe) {
      throw new Error(`El libro con ISBN ${data.isbn} ya está registrado.`);
    }
    return this.repository.create(data);
  }

  async actualizarLibro(id: string, data: Partial<Libro>): Promise<Libro> {
    return this.repository.update(id, data);
  }

  async eliminarLibro(id: string): Promise<Libro> {
    return this.repository.delete(id);
  }
}
