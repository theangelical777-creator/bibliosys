// src/services/PrestamoService.ts
import { PrismaClient, Prestamo } from '@prisma/client';
import { PrestamoRepository } from '../repositories/PrestamoRepository';
import { PrestamoFacade } from '../facades/PrestamoFacade';
import { PrestamoStateFactory, PrestamoContext, PrestamoEntity } from '../patterns/states/PrestamoState';
import { MultaStrategyFactory, MultaContext } from '../patterns/strategies/MultaStrategy';
import { BibliotecaConfig } from '../config/BibliotecaConfig';
import {
  DevolucionSubject,
  InventarioDevolucionObserver,
  ReservasDevolucionObserver,
  AuditoriaDevolucionObserver
} from '../patterns/observers/DevolucionObserver';
import { NotificacionService } from './NotificacionService';

export class PrestamoService {
  private repository: PrestamoRepository;
  private prisma: PrismaClient;
  private facade: PrestamoFacade;
  private devSubject: DevolucionSubject;
  private notificacionService: NotificacionService;

  constructor(repository: PrestamoRepository, prisma: PrismaClient, notificacionService: NotificacionService) {
    this.repository = repository;
    this.prisma = prisma;
    this.facade = new PrestamoFacade(prisma);
    this.notificacionService = notificacionService;

    // Inicializar el Sujeto y sus Observadores (Observer Pattern)
    this.devSubject = new DevolucionSubject();
    this.devSubject.attach(new InventarioDevolucionObserver(prisma));
    this.devSubject.attach(new ReservasDevolucionObserver(prisma));
    this.devSubject.attach(new AuditoriaDevolucionObserver(prisma));
  }

  async obtenerTodos(): Promise<any[]> {
    return this.repository.findAll();
  }

  async obtenerPorId(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async obtenerPorUsuario(usuarioId: string): Promise<any[]> {
    return this.repository.findByUsuarioId(usuarioId);
  }

  /**
   * Realizar Préstamo usando el Facade
   */
  async registrarPrestamo(usuarioId: string, libroId: string, nota?: string): Promise<any> {
    // 1. Obtener la duración correspondiente al tipo de usuario en BibliotecaConfig
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new Error('Usuario no encontrado');

    const config = BibliotecaConfig.getInstance();
    const diasPlazo = config.plazos[usuario.tipo.toLowerCase()] || 7;
    
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasPlazo);

    // 2. Ejecutar a través de la Facade
    const prestamo = await this.facade.realizarPrestamo(usuarioId, libroId, fechaVencimiento, nota);

    // 3. Enviar notificación
    const libro = await this.prisma.libro.findUnique({ where: { id: libroId } });
    if (libro) {
      await this.notificacionService.enviarConfirmacionPrestamo(usuario.email, libro.titulo, fechaVencimiento);
    }

    return prestamo;
  }

  /**
   * Devolver Préstamo (State Pattern + Strategy Pattern + Observer Pattern)
   */
  async devolverPrestamo(prestamoId: string): Promise<any> {
    const prestamo = await this.repository.findById(prestamoId);
    if (!prestamo) throw new Error('Préstamo no encontrado');

    // 1. Cargar el State actual
    const state = PrestamoStateFactory.getState(prestamo.estado);
    
    // Preparar el contexto de transición de estado
    const context: PrestamoContext = {
      prestamo: prestamo as PrestamoEntity,
      setEstado: async (nuevoEstado) => {
        await this.prisma.prestamo.update({
          where: { id: prestamoId },
          data: { estado: nuevoEstado }
        });
      },
      saveDevolucion: async (fechaDevolucion) => {
        await this.prisma.prestamo.update({
          where: { id: prestamoId },
          data: { fechaDevolucion }
        });
      },
      saveRenovacion: async () => {} // No aplica para devolución
    };

    const hoy = new Date();

    // Ejecutar transición del Estado (lanza excepción si ya está devuelto o es inválido)
    await state.devolver(context, hoy);

    // 2. Lógica de cálculo de multas (Strategy Pattern)
    let multaRegistrada = null;
    const config = BibliotecaConfig.getInstance();
    const diasVencimiento = new Date(prestamo.fechaVencimiento);

    if (hoy.getTime() > diasVencimiento.getTime()) {
      const diffTime = Math.abs(hoy.getTime() - diasVencimiento.getTime());
      const diasRetraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Verificar si supera los días de gracia
      if (diasRetraso > config.diasGracia) {
        const strategy = MultaStrategyFactory.getStrategy(prestamo.usuario.tipo);
        const multaContext = new MultaContext(strategy);
        const montoMulta = multaContext.calcular(diasRetraso);

        if (montoMulta > 0) {
          // Registrar multa en la BD
          multaRegistrada = await this.prisma.multa.create({
            data: {
              prestamoId: prestamo.id,
              usuarioId: prestamo.usuarioId,
              diasRetraso: diasRetraso,
              monto: montoMulta,
              estado: 'pendiente'
            }
          });

          // Actualizar saldo del usuario
          const nuevoSaldoMultas = prestamo.usuario.multasPendientes + montoMulta;
          let nuevoEstadoUsuario = prestamo.usuario.estado;
          if (nuevoSaldoMultas > config.multaSuspension) {
            nuevoEstadoUsuario = 'suspendido';
          }

          await this.prisma.usuario.update({
            where: { id: prestamo.usuarioId },
            data: {
              multasPendientes: nuevoSaldoMultas,
              estado: nuevoEstadoUsuario
            }
          });
        }
      }
    }

    // 3. Disparar notificaciones a Observadores (Observer Pattern)
    await this.devSubject.notify({
      prestamoId: prestamo.id,
      libroId: prestamo.libroId,
      usuarioId: prestamo.usuarioId,
      fechaDevolucion: hoy
    });

    // Enviar notificación por correo
    await this.notificacionService.enviarNotificacionDevolucion(prestamo.usuario.email, prestamo.libro.titulo);

    return {
      prestamoId,
      estado: 'devuelto',
      multa: multaRegistrada
    };
  }

  /**
   * Renovar Préstamo (State Pattern)
   */
  async renovarPrestamo(prestamoId: string): Promise<any> {
    const prestamo = await this.repository.findById(prestamoId);
    if (!prestamo) throw new Error('Préstamo no encontrado');

    const state = PrestamoStateFactory.getState(prestamo.estado);
    const config = BibliotecaConfig.getInstance();

    const context: PrestamoContext = {
      prestamo: prestamo as PrestamoEntity,
      setEstado: async (nuevoEstado) => {
        await this.prisma.prestamo.update({
          where: { id: prestamoId },
          data: { estado: nuevoEstado }
        });
      },
      saveDevolucion: async () => {}, // No aplica para renovación
      saveRenovacion: async (nuevaVencimiento, renovaciones) => {
        await this.prisma.prestamo.update({
          where: { id: prestamoId },
          data: {
            fechaVencimiento: nuevaVencimiento,
            renovaciones
          }
        });
      }
    };

    // Calcular nueva fecha de vencimiento
    const diasAdicionales = config.plazos[prestamo.usuario.tipo.toLowerCase()] || 7;
    const nuevaFechaVencimiento = new Date(prestamo.fechaVencimiento);
    nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + diasAdicionales);

    // Intentar renovar (Validará el límite en el State correspondiente)
    await state.renovar(context, nuevaFechaVencimiento, config.maxRenovaciones);

    return this.prisma.prestamo.findUnique({
      where: { id: prestamoId },
      include: { libro: true }
    });
  }

  /**
   * Undo a loan action using the Facade
   */
  async deshacerUltimoPrestamo(): Promise<string> {
    return this.facade.deshacerUltimoPrestamo();
  }
}
