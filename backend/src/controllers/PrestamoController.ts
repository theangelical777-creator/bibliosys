// src/controllers/PrestamoController.ts
import { Request, Response } from 'express';
import { PrestamoService } from '../services/PrestamoService';
import { PrismaClient } from '@prisma/client';

export class PrestamoController {
  private service: PrestamoService;
  private prisma: PrismaClient;

  constructor(service: PrestamoService, prisma: PrismaClient) {
    this.service = service;
    this.prisma = prisma;
  }

  async obtenerTodos(req: Request, res: Response) {
    try {
      const prestamos = await this.service.obtenerTodos();
      res.json(prestamos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerMisPrestamos(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    try {
      const prestamos = await this.service.obtenerPorUsuario(user.id);
      res.json(prestamos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async registrar(req: Request, res: Response) {
    const { usuarioId, libroId, nota } = req.body;
    
    // Si es un socio normal el que llama, debe ser solo para su propio ID
    const user = (req as any).user;
    let targetUsuarioId = usuarioId;
    if (user.rol === 'SOCIO') {
      targetUsuarioId = user.id;
    }

    if (!targetUsuarioId || !libroId) {
      return res.status(400).json({ error: 'El usuarioId y libroId son obligatorios.' });
    }

    try {
      const prestamo = await this.service.registrarPrestamo(targetUsuarioId, libroId, nota);
      res.status(201).json(prestamo);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async devolver(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = await this.service.devolverPrestamo(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async renovar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const result = await this.service.renovarPrestamo(id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deshacer(req: Request, res: Response) {
    try {
      const msg = await this.service.deshacerUltimoPrestamo();
      res.json({ message: msg });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async obtenerHistorialAcciones(req: Request, res: Response) {
    try {
      const logs = await this.prisma.logAccion.findMany({
        orderBy: { fecha: 'desc' },
        take: 30
      });
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
