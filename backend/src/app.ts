// src/app.ts
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Repositories
import { LibroRepository } from './repositories/LibroRepository';
import { UsuarioRepository } from './repositories/UsuarioRepository';
import { PrestamoRepository } from './repositories/PrestamoRepository';
import { MultaRepository } from './repositories/MultaRepository';
import { ReservaRepository } from './repositories/ReservaRepository';

// Services
import { NotificacionService } from './services/NotificacionService';
import { CatalogoExternoService } from './services/CatalogoExternoService';
import { LibroService } from './services/LibroService';
import { UsuarioService } from './services/UsuarioService';
import { PrestamoService } from './services/PrestamoService';
import { MultaService } from './services/MultaService';
import { ReservaService } from './services/ReservaService';
import { seedDatabaseIfEmpty } from './services/SeedDbService';

// Controllers
import { AuthController } from './controllers/AuthController';
import { LibroController } from './controllers/LibroController';
import { UsuarioController } from './controllers/UsuarioController';
import { PrestamoController } from './controllers/PrestamoController';
import { MultaController } from './controllers/MultaController';
import { ReservaController } from './controllers/ReservaController';

// Middlewares
import { authMiddleware, roleMiddleware } from './middleware/auth';

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Prisma Client
const prisma = new PrismaClient();
seedDatabaseIfEmpty(prisma);

// Inicializar Capa de Repositorios (Repository Pattern)
const libroRepo = new LibroRepository(prisma);
const usuarioRepo = new UsuarioRepository(prisma);
const prestamoRepo = new PrestamoRepository(prisma);
const multaRepo = new MultaRepository(prisma);
const reservaRepo = new ReservaRepository(prisma);

// Inicializar Capa de Servicios
const notificacionService = new NotificacionService();
const catalogoExternoService = new CatalogoExternoService();

const libroService = new LibroService(libroRepo, catalogoExternoService);
const usuarioService = new UsuarioService(usuarioRepo);
const prestamoService = new PrestamoService(prestamoRepo, prisma, notificacionService);
const multaService = new MultaService(multaRepo, prisma);
const reservaService = new ReservaService(reservaRepo, prisma);

// Inicializar Capa de Controladores
const authCtrl = new AuthController(usuarioService);
const libroCtrl = new LibroController(libroService);
const usuarioCtrl = new UsuarioController(usuarioService);
const prestamoCtrl = new PrestamoController(prestamoService, prisma);
const multaCtrl = new MultaController(multaService);
const reservaCtrl = new ReservaController(reservaService);

// ==================== RUTAS API ====================

// --- Rutas Públicas / Auth ---
app.post('/api/auth/register', (req, res) => authCtrl.registrar(req, res));
app.post('/api/auth/login', (req, res) => authCtrl.login(req, res));

// --- Rutas Protegidas por JWT (Socio / Bibliotecario / Admin) ---
app.use('/api', authMiddleware);

// --- Módulo Catálogo (Libros) ---
app.get('/api/libros', (req, res) => libroCtrl.obtenerTodos(req, res));
app.get('/api/libros/:id', (req, res) => libroCtrl.obtenerPorId(req, res));
app.post('/api/libros', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => libroCtrl.registrar(req, res));
app.put('/api/libros/:id', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => libroCtrl.actualizar(req, res));
app.delete('/api/libros/:id', roleMiddleware(['ADMIN']), (req, res) => libroCtrl.eliminar(req, res));
app.post('/api/libros/importar/:isbn', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => libroCtrl.importar(req, res));

// --- Módulo Usuarios / Socios ---
app.get('/api/usuarios/me', (req, res) => usuarioCtrl.obtenerMe(req, res));
app.get('/api/usuarios', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => usuarioCtrl.obtenerTodos(req, res));
app.get('/api/usuarios/:id', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => usuarioCtrl.obtenerPorId(req, res));
app.put('/api/usuarios/:id', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => usuarioCtrl.actualizar(req, res));
app.delete('/api/usuarios/:id', roleMiddleware(['ADMIN']), (req, res) => usuarioCtrl.eliminar(req, res));

// --- Módulo Préstamos ---
app.get('/api/prestamos', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => prestamoCtrl.obtenerTodos(req, res));
app.get('/api/prestamos/mis-prestamos', (req, res) => prestamoCtrl.obtenerMisPrestamos(req, res));
app.post('/api/prestamos', (req, res) => prestamoCtrl.registrar(req, res));
app.post('/api/prestamos/:id/devolver', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => prestamoCtrl.devolver(req, res));
app.post('/api/prestamos/:id/renovar', (req, res) => prestamoCtrl.renovar(req, res));
// Historial de comandos y reversión (Command Pattern Undo)
app.post('/api/prestamos/deshacer', roleMiddleware(['ADMIN']), (req, res) => prestamoCtrl.deshacer(req, res));
app.get('/api/prestamos/historial-acciones', roleMiddleware(['ADMIN']), (req, res) => prestamoCtrl.obtenerHistorialAcciones(req, res));

// --- Módulo Multas ---
app.get('/api/multas', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => multaCtrl.obtenerTodas(req, res));
app.get('/api/multas/mis-multas', (req, res) => multaCtrl.obtenerMisMultas(req, res));
app.post('/api/multas/:id/pagar', (req, res) => multaCtrl.pagar(req, res));

// --- Módulo Reservas ---
app.get('/api/reservas', roleMiddleware(['ADMIN', 'BIBLIOTECARIO']), (req, res) => reservaCtrl.obtenerTodas(req, res));
app.get('/api/reservas/mis-reservas', (req, res) => reservaCtrl.obtenerMisReservas(req, res));
app.post('/api/reservas', (req, res) => reservaCtrl.reservar(req, res));
app.post('/api/reservas/:id/cancelar', (req, res) => reservaCtrl.cancelar(req, res));

export default app;
export { prisma };
