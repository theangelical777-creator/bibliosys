// src/services/MultaService.ts
import { PrismaClient, Multa } from '@prisma/client';
import { MultaRepository } from '../repositories/MultaRepository';
import { BibliotecaConfig } from '../config/BibliotecaConfig';

export class MultaService {
  private repository: MultaRepository;
  private prisma: PrismaClient;

  constructor(repository: MultaRepository, prisma: PrismaClient) {
    this.repository = repository;
    this.prisma = prisma;
  }

  async obtenerTodas(): Promise<any[]> {
    return this.repository.findAll();
  }

  async obtenerPorUsuario(usuarioId: string): Promise<any[]> {
    return this.repository.findByUsuarioId(usuarioId);
  }

  async pagarMulta(multaId: string): Promise<Multa> {
    const multa = await this.repository.findById(multaId);
    if (!multa) throw new Error('Multa no encontrada');
    if (multa.estado === 'pagada') throw new Error('Esta multa ya fue pagada.');

    const config = BibliotecaConfig.getInstance();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Marcar multa como pagada
      const multaPagada = await tx.multa.update({
        where: { id: multaId },
        data: { estado: 'pagada' }
      });

      // 2. Descontar del total del usuario
      const usuario = await tx.usuario.findUnique({ where: { id: multa.usuarioId } });
      if (usuario) {
        const nuevoSaldo = Math.max(0, usuario.multasPendientes - multa.monto);
        
        // Si el saldo baja del límite de suspensión, reactivar al usuario
        let nuevoEstado = usuario.estado;
        if (nuevoSaldo <= config.multaSuspension && usuario.estado === 'suspendido') {
          nuevoEstado = 'activo';
        }

        await tx.usuario.update({
          where: { id: multa.usuarioId },
          data: {
            multasPendientes: nuevoSaldo,
            estado: nuevoEstado
          }
        });
      }

      return multaPagada;
    });

    return result;
  }
}
