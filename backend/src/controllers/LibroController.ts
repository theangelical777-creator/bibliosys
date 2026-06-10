// src/controllers/LibroController.ts
import { Request, Response } from 'express';
import { LibroService } from '../services/LibroService';

export class LibroController {
  private service: LibroService;

  constructor(service: LibroService) {
    this.service = service;
  }

  async obtenerTodos(req: Request, res: Response) {
    const { q } = req.query;
    try {
      if (q && typeof q === 'string') {
        const libros = await this.service.buscarLocales(q);
        return res.json(libros);
      }
      const libros = await this.service.obtenerTodos();
      res.json(libros);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const libro = await this.service.obtenerPorId(id);
      if (!libro) {
        return res.status(404).json({ error: 'Libro no encontrado' });
      }
      res.json(libro);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async registrar(req: Request, res: Response) {
    try {
      const nuevo = await this.service.registrarLibroManual(req.body);
      res.status(201).json(nuevo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async actualizar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const actualizado = await this.service.actualizarLibro(id, req.body);
      res.json(actualizado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async eliminar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await this.service.eliminarLibro(id);
      res.json({ message: 'Libro eliminado con éxito.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async importar(req: Request, res: Response) {
    const { isbn } = req.params;
    if (!isbn) {
      return res.status(400).json({ error: 'El ISBN es obligatorio.' });
    }
    try {
      const libro = await this.service.buscarYRegistrarPorIsbn(isbn);
      res.status(201).json(libro);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
