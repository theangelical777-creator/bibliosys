// src/controllers/UsuarioController.ts
import { Request, Response } from 'express';
import { UsuarioService } from '../services/UsuarioService';

export class UsuarioController {
  private service: UsuarioService;

  constructor(service: UsuarioService) {
    this.service = service;
  }

  async obtenerTodos(req: Request, res: Response) {
    try {
      const usuarios = await this.service.obtenerTodos();
      res.json(usuarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerMe(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    try {
      const perfil = await this.service.obtenerPorId(user.id);
      if (!perfil) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      const { passwordHash, ...perfilResponse } = perfil as any;
      res.json(perfilResponse);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const usuario = await this.service.obtenerPorId(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      const { passwordHash, ...userResponse } = usuario as any;
      res.json(userResponse);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async actualizar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const actualizado = await this.service.actualizarPerfil(id, req.body);
      const { passwordHash, ...userResponse } = actualizado as any;
      res.json(userResponse);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async eliminar(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await this.service.eliminarUsuario(id);
      res.json({ message: 'Usuario eliminado con éxito.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
