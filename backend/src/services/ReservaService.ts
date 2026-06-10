// src/services/ReservaService.ts
import { PrismaClient, Reserva } from '@prisma/client';
import { ReservaRepository } from '../repositories/ReservaRepository';

export class ReservaService {
  private repository: ReservaRepository;
  private prisma: PrismaClient;

  constructor(repository: ReservaRepository, prisma: PrismaClient) {
    this.repository = repository;
    this.prisma = prisma;
  }

  async obtenerTodas(): Promise<any[]> {
    return this.repository.findAll();
  }

  async obtenerPorUsuario(usuarioId: string): Promise<any[]> {
    return this.repository.findByUsuarioId(usuarioId);
  }

  async crearReserva(usuarioId: string, libroId: string): Promise<Reserva> {
    // 1. Validar que el libro exista
    const libro = await this.prisma.libro.findUnique({ where: { id: libroId } });
    if (!libro) throw new Error('El libro no existe.');

    // 2. Validar que el usuario exista
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new Error('El usuario no existe.');

    // 3. Si hay ejemplares disponibles, no es necesario reservar
    if (libro.stockDisponible > 0 && libro.estado === 'disponible') {
      throw new Error(`El libro "${libro.titulo}" tiene stock disponible (${libro.stockDisponible}). Puedes realizar un préstamo directo.`);
    }

    // 4. Validar si el usuario ya tiene una reserva activa para este libro
    const existente = await this.prisma.reserva.findFirst({
      where: {
        usuarioId,
        libroId,
        estado: { in: ['en_espera', 'notificado'] }
      }
    });
    if (existente) {
      throw new Error('Ya cuentas con una reserva activa para este libro.');
    }

    // 5. Crear la reserva
    return this.repository.create({
      usuarioId,
      libroId,
      estado: 'en_espera'
    });
  }

  async cancelarReserva(reservaId: string): Promise<Reserva> {
    const reserva = await this.repository.findById(reservaId);
    if (!reserva) throw new Error('La reserva no existe.');
    if (reserva.estado !== 'en_espera' && reserva.estado !== 'notificado') {
      throw new Error(`No se puede cancelar una reserva con estado '${reserva.estado}'.`);
    }

    return this.repository.update(reservaId, { estado: 'cancelado' });
  }

  async completarReserva(reservaId: string): Promise<Reserva> {
    return this.repository.update(reservaId, { estado: 'completado' });
  }
}
