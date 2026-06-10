// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UsuarioService } from '../services/UsuarioService';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-biblio-sys-2026';

export class AuthController {
  private service: UsuarioService;

  constructor(service: UsuarioService) {
    this.service = service;
  }

  async registrar(req: Request, res: Response) {
    const { nombre, email, password, telefono, tipo, rol } = req.body;
    
    if (!nombre || !email || !password || !telefono || !tipo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, password, telefono, tipo).' });
    }

    try {
      const nuevoUsuario = await this.service.registrarSocio({
        nombre,
        email,
        passwordPlain: password,
        telefono,
        tipo,
        rol: rol || 'SOCIO'
      });

      // No retornar el password hash
      const { passwordHash, ...userResponse } = nuevoUsuario as any;
      res.status(201).json(userResponse);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan credenciales (email, password).' });
    }

    try {
      const usuario = await this.service.obtenerPorId(email); // En nuestro repo buscamos por email abajo
      // Buscaremos por email usando el servicio propiamente
      const usuarioEncontrado = await this.service.obtenerTodos().then(list => list.find(u => u.email === email));
      
      if (!usuarioEncontrado) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }

      const passValida = await bcrypt.compare(password, usuarioEncontrado.passwordHash);
      if (!passValida) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }

      // Firmar token
      const token = jwt.sign(
        {
          id: usuarioEncontrado.id,
          email: usuarioEncontrado.email,
          rol: usuarioEncontrado.rol,
          tipo: usuarioEncontrado.tipo
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      const { passwordHash, ...userResponse } = usuarioEncontrado as any;
      res.json({
        token,
        usuario: userResponse
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
