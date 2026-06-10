// src/controllers/ReservaController.ts
import { Request, Response } from 'express';
import { ReservaService } from '../services/ReservaService';

export class ReservaController {
  private service: ReservaService;

  constructor(service: ReservaService) {
    this.service = service;
  }

  async obtenerTodas(req: Request, res: Response) {
    try {
      const reservas = await this.service.obtenerTodas();
      res.json(reservas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerMisReservas(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    try {
      const reservas = await this.service.obtenerPorUsuario(user.id);
      res.json(reservas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async reservar(req: Request, res: Response) {
    const { libroId } = req.body;
    const user = (req as any).user;

    if (!libroId) {
      return res.status(400).json({ error: 'El libroId es obligatorio.' });
    }

    try {
      const reserva = await this.service.crearReserva(user.id, libroId);
      res.status(201).json(reserva);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async cancelar(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      const reserva = await this.service.obtenerTodas().then(list => list.find(r => r.id === id));
      if (!reserva) {
        return res.status(404).json({ error: 'La reserva no existe.' });
      }

      // El socio solo puede cancelar su propia reserva
      if (user.rol === 'SOCIO' && reserva.usuarioId !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta reserva.' });
      }

      const cancelada = await this.service.cancelarReserva(id);
      res.json(cancelada);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
