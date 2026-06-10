// src/controllers/MultaController.ts
import { Request, Response } from 'express';
import { MultaService } from '../services/MultaService';

export class MultaController {
  private service: MultaService;

  constructor(service: MultaService) {
    this.service = service;
  }

  async obtenerTodas(req: Request, res: Response) {
    try {
      const multas = await this.service.obtenerTodas();
      res.json(multas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerMisMultas(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    try {
      const multas = await this.service.obtenerPorUsuario(user.id);
      res.json(multas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async pagar(req: Request, res: Response) {
    const { id } = req.params;
    const user = (req as any).user;

    try {
      // Validar si el socio es dueño de la multa o es admin/bibliotecario
      const multa = await this.service.obtenerTodas().then(list => list.find(m => m.id === id));
      if (!multa) {
        return res.status(404).json({ error: 'Multa no encontrada' });
      }

      if (user.rol === 'SOCIO' && multa.usuarioId !== user.id) {
        return res.status(403).json({ error: 'No tienes permiso para pagar esta multa.' });
      }

      const pagada = await this.service.pagarMulta(id);
      res.json({
        message: 'Multa pagada con éxito y saldo del socio actualizado.',
        multa: pagada
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
