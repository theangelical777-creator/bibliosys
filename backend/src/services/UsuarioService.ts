// src/services/UsuarioService.ts
import bcrypt from 'bcrypt';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { UserFactory } from '../patterns/factories/UserFactory';
import { Usuario } from '@prisma/client';

export class UsuarioService {
  private repository: UsuarioRepository;

  constructor(repository: UsuarioRepository) {
    this.repository = repository;
  }

  async obtenerTodos(): Promise<Usuario[]> {
    return this.repository.findAll();
  }

  async obtenerPorId(id: string): Promise<Usuario | null> {
    return this.repository.findById(id);
  }

  async registrarSocio(data: {
    nombre: string;
    email: string;
    passwordPlain: string;
    telefono: string;
    tipo: 'estudiante' | 'profesor' | 'visitante';
    rol?: 'ADMIN' | 'BIBLIOTECARIO' | 'SOCIO';
  }): Promise<Usuario> {
    const existe = await this.repository.findByEmail(data.email);
    if (existe) {
      throw new Error(`El email ${data.email} ya se encuentra registrado.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordPlain, salt);

    // Patrón Factory Method
    const configData = UserFactory.createUser(
      data.tipo,
      data.nombre,
      data.email,
      passwordHash,
      data.telefono,
      data.rol || 'SOCIO'
    );

    return this.repository.create(configData);
  }

  async actualizarPerfil(id: string, data: Partial<Usuario>): Promise<Usuario> {
    return this.repository.update(id, data);
  }

  async eliminarUsuario(id: string): Promise<Usuario> {
    return this.repository.delete(id);
  }
}
