// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Library,
  BookOpen,
  Users,
  FileClock,
  BadgeAlert,
  BookmarkCheck,
  History,
  Search,
  Plus,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CircleDollarSign,
  Globe,
  Undo
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalogo' | 'prestamos' | 'multas' | 'reservas' | 'usuarios' | 'comandos'>('catalogo');

  // Listas de datos
  const [libros, setLibros] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [prestamos, setPrestamos] = useState<any[]>([]);
  const [multas, setMultas] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [comandos, setComandos] = useState<any[]>([]);

  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Formularios de Creación
  const [isbnImportar, setIsbnImportar] = useState('');
  const [nuevoLibro, setNuevoLibro] = useState({ isbn: '', titulo: '', autor: '', editorial: '', anio: new Date().getFullYear(), categoria: '', stockTotal: 3 });
  const [nuevoPrestamo, setNuevoPrestamo] = useState({ usuarioId: '', libroId: '', nota: '' });
  const [showAddLibroModal, setShowAddLibroModal] = useState(false);
  const [showAddPrestamoModal, setShowAddPrestamoModal] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarDatos = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (activeTab === 'catalogo') {
        const data = await api.libros.list(searchQuery);
        setLibros(data);
      } else if (activeTab === 'prestamos') {
        if (user.rol === 'SOCIO') {
          const data = await api.prestamos.listMine();
          setPrestamos(data);
        } else {
          const data = await api.prestamos.list();
          setPrestamos(data);
        }
      } else if (activeTab === 'multas') {
        if (user.rol === 'SOCIO') {
          const data = await api.multas.listMine();
          setMultas(data);
        } else {
          const data = await api.multas.list();
          setMultas(data);
        }
      } else if (activeTab === 'reservas') {
        if (user.rol === 'SOCIO') {
          const data = await api.reservas.listMine();
          setReservas(data);
        } else {
          const data = await api.reservas.list();
          setReservas(data);
        }
      } else if (activeTab === 'usuarios' && user.rol !== 'SOCIO') {
        const data = await api.usuarios.list();
        setUsuarios(data);
      } else if (activeTab === 'comandos' && user.rol === 'ADMIN') {
        const data = await api.prestamos.getHistory();
        setComandos(data);
      }
    } catch (err: any) {
      showToast(err.message || 'Error al cargar los datos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Acciones sobre libros
  const handleBuscarLibros = (e: React.FormEvent) => {
    e.preventDefault();
    cargarDatos();
  };

  const handleImportarISBN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isbnImportar) return;
    setIsLoading(true);
    try {
      const libro = await api.libros.importByIsbn(isbnImportar);
      showToast(`Libro "${libro.titulo}" importado correctamente mediante el Adaptador de Catálogo.`, 'success');
      setIsbnImportar('');
      cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al importar de catálogo externo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrearLibroManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.libros.create({
        ...nuevoLibro,
        anio: Number(nuevoLibro.anio),
        stockTotal: Number(nuevoLibro.stockTotal),
        stockDisponible: Number(nuevoLibro.stockTotal),
        estado: 'disponible'
      });
      showToast('Libro registrado manualmente en catálogo local.', 'success');
      setNuevoLibro({ isbn: '', titulo: '', autor: '', editorial: '', anio: 2026, categoria: '', stockTotal: 3 });
      setShowAddLibroModal(false);
      cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al crear libro.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminarLibro = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este libro del catálogo?')) return;
    setIsLoading(true);
    try {
      await api.libros.delete(id);
      showToast('Libro eliminado correctamente.', 'success');
      cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar libro.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Acciones sobre préstamos
  const handleCrearPrestamo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.prestamos.create(nuevoPrestamo.usuarioId, nuevoPrestamo.libroId, nuevoPrestamo.nota);
      showToast('Préstamo registrado exitosamente (Validado por Chain de Responsabilidades y creado con Builder).', 'success');
      setNuevoPrestamo({ usuarioId: '', libroId: '', nota: '' });
      setShowAddPrestamoModal(false);
      cargarDatos();
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Error al registrar préstamo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocioPedirPrestado = async (libroId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await api.prestamos.create(user.id, libroId);
      showToast('Préstamo realizado con éxito. ¡Pasa por el mostrador a retirarlo!', 'success');
      cargarDatos();
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Error al pedir préstamo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevolverPrestamo = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await api.prestamos.devolver(id);
      if (res.multa) {
        showToast(`Libro devuelto. Se ha generado una multa de RD$${res.multa.monto} por retraso (Estrategia de Multas ejecutada).`, 'error');
      } else {
        showToast('Devolución registrada exitosamente. El inventario se actualizó y los observadores fueron notificados.', 'success');
      }
      cargarDatos();
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Error al devolver préstamo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenovarPrestamo = async (id: string) => {
    setIsLoading(true);
    try {
      await api.prestamos.renovar(id);
      showToast('Préstamo renovado con éxito (Estado actualizado a RENOVADO por el State pattern).', 'success');
      cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al renovar préstamo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Deshacer (Command Undo)
  const handleDeshacerUltimoPrestamo = async () => {
    setIsLoading(true);
    try {
      const res = await api.prestamos.undo();
      showToast(res.message, 'success');
      cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al revertir la acción.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Pagar multa
  const handlePagarMulta = async (id: string) => {
    setIsLoading(true);
    try {
      await api.multas.pagar(id);
      showToast('Multa pagada exitosamente. Tu saldo de cuenta se ha actualizado.', 'success');
      cargarDatos();
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Error al pagar multa.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reservas
  const handleReservarLibro = async (libroId: string) => {
    setIsLoading(true);
    try {
      await api.reservas.create(libroId);
      showToast('Libro reservado exitosamente. Se te ha agregado a la lista de espera.', 'success');
      cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al realizar reserva.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelarReserva = async (id: string) => {
    if (!window.confirm('¿Deseas cancelar esta reserva?')) return;
    setIsLoading(true);
    try {
      await api.reservas.cancelar(id);
      showToast('Reserva cancelada correctamente.', 'success');
      cargarDatos();
    } catch (err: any) {
      showToast(err.message || 'Error al cancelar reserva.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border transition-all flex items-center max-w-sm ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-brand-500 text-brand-300'
              : 'bg-slate-900/95 border-red-500 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mr-3 text-brand-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 mr-3 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="h-16 border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-brand-500/20 rounded-lg flex items-center justify-center text-brand-400">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
              BiblioSys
              <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                v1.0
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.nombre}</p>
            <div className="flex items-center justify-end space-x-2 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.2 bg-brand-900/30 border border-brand-800 text-brand-300 rounded uppercase font-bold">
                {user?.rol}
              </span>
              {user?.rol === 'SOCIO' && (
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded uppercase font-semibold">
                  Socio: {user?.tipo}
                </span>
              )}
            </div>
          </div>

          {user?.rol === 'SOCIO' && (
            <div className="flex items-center bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
              <CircleDollarSign className="h-4 w-4 mr-2 text-yellow-500" />
              <div className="text-left">
                <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none">Multas</span>
                <span className={`text-xs font-bold ${user.multasPendientes > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                  RD$ {user.multasPendientes.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="h-9 w-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-slate-900 bg-slate-900/20 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Módulos</p>
            
            <button
              onClick={() => setActiveTab('catalogo')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'catalogo'
                  ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Catálogo de Libros</span>
            </button>

            <button
              onClick={() => setActiveTab('prestamos')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'prestamos'
                  ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <FileClock className="h-4 w-4" />
              <span>{user?.rol === 'SOCIO' ? 'Mis Préstamos' : 'Préstamos Globales'}</span>
            </button>

            <button
              onClick={() => setActiveTab('reservas')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reservas'
                  ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>{user?.rol === 'SOCIO' ? 'Mis Reservas' : 'Reservas Activas'}</span>
            </button>

            <button
              onClick={() => setActiveTab('multas')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'multas'
                  ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <BadgeAlert className="h-4 w-4" />
              <span>{user?.rol === 'SOCIO' ? 'Mis Multas' : 'Multas Generadas'}</span>
            </button>

            {user?.rol !== 'SOCIO' && (
              <>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-4 mb-2">Administración</p>
                
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'usuarios'
                      ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Gestión de Socios</span>
                </button>
              </>
            )}

            {user?.rol === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('comandos')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'comandos'
                    ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Panel de Comandos</span>
              </button>
            )}
          </div>

          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
            <span className="block text-slate-500 font-semibold mb-1">Estado de Cuenta</span>
            <span className="text-slate-300 font-medium">Límite de préstamos:</span>
            <span className="block text-brand-400 font-bold mt-0.5">
              {user?.tipo === 'estudiante' && '3 Libros / 15 Días'}
              {user?.tipo === 'profesor' && '10 Libros / 60 Días'}
              {user?.tipo === 'visitante' && '1 Libro / 7 Días'}
              {user?.rol === 'ADMIN' && 'Ilimitado (Administrador)'}
              {user?.rol === 'BIBLIOTECARIO' && 'Control Total'}
            </span>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Barra de Búsqueda / Acción superior */}
          <div className="p-6 border-b border-slate-900/60 bg-slate-900/10 shrink-0 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-white capitalize">{activeTab.replace('catalogo', 'Catálogo de Libros').replace('prestamos', 'Historial de Préstamos').replace('multas', 'Gestión de Multas').replace('reservas', 'Reservas de Libros').replace('usuarios', 'Socios Registrados').replace('comandos', 'Historial de Auditoría (Command Undo)')}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'catalogo' && 'Explora el catálogo físico e importa obras externas ingresando su código ISBN.'}
                {activeTab === 'prestamos' && 'Monitorea el estado de préstamos activos, retrasos y plazos de renovación.'}
                {activeTab === 'multas' && 'Monitorea y liquida multas vigentes por devolución tardía.'}
                {activeTab === 'reservas' && 'Gestiona tus solicitudes de espera para libros con stock temporal agotado.'}
                {activeTab === 'usuarios' && 'Registra, actualiza y suspende cuentas de socios de la biblioteca.'}
                {activeTab === 'comandos' && 'Panel exclusivo del Administrador para deshacer las últimas transacciones críticas de préstamos.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={cargarDatos}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Recargar datos"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              {activeTab === 'catalogo' && user?.rol !== 'SOCIO' && (
                <button
                  onClick={() => setShowAddLibroModal(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-brand-600/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nuevo Libro</span>
                </button>
              )}

              {activeTab === 'prestamos' && user?.rol !== 'SOCIO' && (
                <button
                  onClick={() => setShowAddPrestamoModal(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-brand-600/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Registrar Préstamo</span>
                </button>
              )}
            </div>
          </div>

          {/* VISTAS DE PANELES */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                <span className="text-sm font-medium">Buscando en la base de datos...</span>
              </div>
            ) : (
              <>
                {/* 1. VISTA CATALOGO */}
                {activeTab === 'catalogo' && (
                  <div className="space-y-6">
                    {/* Búsqueda y Adaptador ISBN */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Búsqueda local */}
                      <form onSubmit={handleBuscarLibros} className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-500" />
                          <input
                            type="text"
                            placeholder="Buscar por título, autor, categoría o ISBN..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900/40 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                          />
                        </div>
                        <button type="submit" className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-800">
                          Buscar
                        </button>
                      </form>

                      {/* Importación ISBN externa */}
                      {user?.rol !== 'SOCIO' && (
                        <form onSubmit={handleImportarISBN} className="flex gap-2">
                          <div className="relative flex-1">
                            <Globe className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-500" />
                            <input
                              type="text"
                              placeholder="Importar por ISBN (ej: 9780132350884)"
                              value={isbnImportar}
                              onChange={(e) => setIsbnImportar(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-slate-900/40 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                            />
                          </div>
                          <button type="submit" className="px-4 py-2 bg-brand-700 hover:bg-brand-600 rounded-lg text-sm font-semibold text-white">
                            Importar API
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Catálogo de libros cards */}
                    {libros.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No se encontraron libros cargados en el catálogo.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {libros.map((libro) => (
                          <div key={libro.id} className="glass-panel glass-panel-hover p-5 rounded-xl flex flex-col justify-between h-56">
                            <div>
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-[10px] bg-slate-800 text-brand-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                  {libro.categoria}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    libro.stockDisponible > 0
                                      ? 'bg-green-950/40 text-green-400 border border-green-900'
                                      : 'bg-red-950/40 text-red-400 border border-red-900'
                                  }`}
                                >
                                  {libro.stockDisponible > 0 ? `Disponibles: ${libro.stockDisponible}` : 'Agotado'}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-white line-clamp-1 mb-1" title={libro.titulo}>
                                {libro.titulo}
                              </h3>
                              <p className="text-xs text-slate-400 mb-0.5">Por: <span className="text-slate-300 font-medium">{libro.autor}</span></p>
                              <p className="text-[11px] text-slate-500">{libro.editorial} · {libro.anio}</p>
                              <p className="text-[10px] text-slate-500 mt-1">ISBN: {libro.isbn}</p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-3">
                              {user?.rol === 'SOCIO' ? (
                                <>
                                  {libro.stockDisponible > 0 ? (
                                    <button
                                      onClick={() => handleSocioPedirPrestado(libro.id)}
                                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-lg transition-colors w-full"
                                    >
                                      Tomar Prestado
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleReservarLibro(libro.id)}
                                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg transition-colors w-full"
                                    >
                                      Reservar en Cola
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-slate-500">Stock: {libro.stockDisponible}/{libro.stockTotal}</span>
                                  <div className="flex space-x-2">
                                    {user?.rol === 'ADMIN' && (
                                      <button
                                        onClick={() => handleEliminarLibro(libro.id)}
                                        className="px-2 py-1 text-xs bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg transition-colors"
                                      >
                                        Eliminar
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. VISTA PRESTAMOS */}
                {activeTab === 'prestamos' && (
                  <div className="space-y-4">
                    {prestamos.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No hay registros de préstamos.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-900 rounded-xl">
                        <table className="w-full text-left border-collapse bg-slate-900/20">
                          <thead>
                            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                              <th className="p-4">Libro</th>
                              <th className="p-4">Socio</th>
                              <th className="p-4">Fecha Préstamo</th>
                              <th className="p-4">Fecha Vencimiento</th>
                              <th className="p-4">Estado</th>
                              <th className="p-4 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-900">
                            {prestamos.map((prestamo) => {
                              const vDate = new Date(prestamo.fechaVencimiento);
                              const isLate = new Date() > vDate && prestamo.estado !== 'devuelto';
                              return (
                                <tr key={prestamo.id} className="hover:bg-slate-900/40">
                                  <td className="p-4">
                                    <p className="font-semibold text-white">{prestamo.libro?.titulo}</p>
                                    <span className="text-[10px] text-slate-500">ISBN: {prestamo.libro?.isbn}</span>
                                  </td>
                                  <td className="p-4">
                                    <p className="font-medium text-slate-200">{prestamo.usuario?.nombre}</p>
                                    <span className="text-[10px] text-slate-500 capitalize">{prestamo.usuario?.tipo}</span>
                                  </td>
                                  <td className="p-4 text-slate-300">
                                    {new Date(prestamo.fechaPrestamo).toLocaleDateString()}
                                  </td>
                                  <td className="p-4">
                                    <span className={isLate ? 'text-red-400 font-semibold' : 'text-slate-300'}>
                                      {vDate.toLocaleDateString()}
                                    </span>
                                    {isLate && (
                                      <span className="block text-[10px] text-red-400 font-bold">¡Vencido!</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                        prestamo.estado === 'devuelto'
                                          ? 'bg-green-950/40 text-green-400 border border-green-900'
                                          : prestamo.estado === 'vencido' || isLate
                                          ? 'bg-red-950/40 text-red-400 border border-red-900'
                                          : prestamo.estado === 'renovado'
                                          ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900'
                                          : 'bg-brand-950/40 text-brand-400 border border-brand-900'
                                      }`}
                                    >
                                      {prestamo.estado}
                                    </span>
                                    {prestamo.renovaciones > 0 && (
                                      <span className="block text-[10px] text-slate-500 mt-0.5">
                                        Renovaciones: {prestamo.renovaciones}/2
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                      {prestamo.estado !== 'devuelto' && (
                                        <>
                                          <button
                                            onClick={() => handleRenovarPrestamo(prestamo.id)}
                                            className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-xs font-semibold rounded hover:bg-slate-700 text-slate-200"
                                          >
                                            Renovar
                                          </button>
                                          {user?.rol !== 'SOCIO' && (
                                            <button
                                              onClick={() => handleDevolverPrestamo(prestamo.id)}
                                              className="px-2.5 py-1 bg-green-700 hover:bg-green-600 text-xs font-bold rounded text-white"
                                            >
                                              Devolver
                                            </button>
                                          )}
                                        </>
                                      )}
                                      {prestamo.estado === 'devuelto' && (
                                        <span className="text-xs text-slate-500 font-medium">Completado</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. VISTA MULTAS */}
                {activeTab === 'multas' && (
                  <div className="space-y-4">
                    {multas.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No cuentas con multas pendientes de pago en este momento.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {multas.map((multa) => (
                          <div key={multa.id} className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-44">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                    multa.estado === 'pendiente'
                                      ? 'bg-red-950/40 text-red-400 border-red-900'
                                      : 'bg-green-950/40 text-green-400 border-green-900'
                                  }`}
                                >
                                  {multa.estado}
                                </span>
                                <span className="text-xs text-slate-400">{multa.diasRetraso} días de retraso</span>
                              </div>
                              <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                                {multa.prestamo?.libro?.titulo}
                              </h3>
                              {user?.rol !== 'SOCIO' && (
                                <p className="text-xs text-slate-400">Socio: <span className="text-slate-200">{multa.usuario?.nombre}</span></p>
                              )}
                              <p className="text-lg font-black text-white mt-1">
                                RD$ {multa.monto.toFixed(2)}
                              </p>
                            </div>
                            
                            {multa.estado === 'pendiente' && (
                              <button
                                onClick={() => handlePagarMulta(multa.id)}
                                className="w-full mt-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white rounded-lg transition-colors"
                              >
                                Pagar Multa (Simulación)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. VISTA RESERVAS */}
                {activeTab === 'reservas' && (
                  <div className="space-y-4">
                    {reservas.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No hay reservas activas en este momento.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reservas.map((reserva) => (
                          <div key={reserva.id} className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-40">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                    reserva.estado === 'en_espera'
                                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                                      : reserva.estado === 'notificado'
                                      ? 'bg-yellow-950/40 text-yellow-400 border-yellow-900 animate-pulse'
                                      : reserva.estado === 'cancelado'
                                      ? 'bg-red-950/40 text-red-400 border-red-905'
                                      : 'bg-green-950/40 text-green-400 border-green-900'
                                  }`}
                                >
                                  {reserva.estado.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(reserva.fechaReserva).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                                {reserva.libro?.titulo}
                              </h3>
                              {user?.rol !== 'SOCIO' && (
                                <p className="text-xs text-slate-400">Socio en cola: <span className="text-slate-200">{reserva.usuario?.nombre}</span></p>
                              )}
                            </div>

                            {(reserva.estado === 'en_espera' || reserva.estado === 'notificado') && (
                              <button
                                onClick={() => handleCancelarReserva(reserva.id)}
                                className="w-full mt-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-semibold rounded-lg transition-colors"
                              >
                                Cancelar Reserva
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. VISTA USUARIOS (ADMIN/BIBLIOTECARIO) */}
                {activeTab === 'usuarios' && user?.rol !== 'SOCIO' && (
                  <div className="space-y-4">
                    {usuarios.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No hay usuarios registrados.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-900 rounded-xl">
                        <table className="w-full text-left border-collapse bg-slate-900/20">
                          <thead>
                            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                              <th className="p-4">Nombre / Email</th>
                              <th className="p-4">Teléfono</th>
                              <th className="p-4">Tipo Socio</th>
                              <th className="p-4">Rol de Sistema</th>
                              <th className="p-4">Multas Pendientes</th>
                              <th className="p-4">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-900">
                            {usuarios.map((usr) => (
                              <tr key={usr.id} className="hover:bg-slate-900/40">
                                <td className="p-4">
                                  <p className="font-semibold text-white">{usr.nombre}</p>
                                  <span className="text-xs text-slate-500">{usr.email}</span>
                                </td>
                                <td className="p-4 text-slate-300">{usr.telefono}</td>
                                <td className="p-4 capitalize text-slate-300">{usr.tipo}</td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] uppercase font-bold">
                                    {usr.rol}
                                  </span>
                                </td>
                                <td className="p-4 font-semibold text-slate-300">
                                  RD$ {usr.multasPendientes.toFixed(2)}
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                      usr.estado === 'activo'
                                        ? 'bg-green-950/40 text-green-400 border border-green-900'
                                        : 'bg-red-950/40 text-red-400 border border-red-900'
                                    }`}
                                  >
                                    {usr.estado}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. VISTA PANEL DE COMANDOS (ADMIN ONLY) */}
                {activeTab === 'comandos' && user?.rol === 'ADMIN' && (
                  <div className="space-y-6">
                    {/* Botón de Undo */}
                    <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div>
                        <h3 className="font-bold text-white flex items-center">
                          <Undo className="h-4 w-4 mr-2 text-brand-400" /> Patrón Command: Deshacer Préstamo
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Si un préstamo fue registrado por error, puedes deshacer el último préstamo activo. El sistema eliminará el préstamo y restaurará el stock del libro.
                        </p>
                      </div>
                      <button
                        onClick={handleDeshacerUltimaAccion}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-bold text-white transition-all shadow-lg shadow-brand-600/10 flex items-center"
                      >
                        <Undo className="h-4 w-4 mr-2" /> Deshacer Último
                      </button>
                    </div>

                    {/* Historial de logs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logs de Auditoría</h4>
                      {comandos.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                          No hay logs de acciones registrados en esta sesión.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {comandos.map((cmd) => (
                            <div
                              key={cmd.id}
                              className={`p-4 rounded-xl border flex justify-between items-center ${
                                cmd.reversado
                                  ? 'bg-slate-900/20 border-slate-900/60 opacity-60'
                                  : 'bg-slate-900/40 border-slate-800'
                              }`}
                            >
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase rounded">
                                    {cmd.commandName}
                                  </span>
                                  {cmd.reversado && (
                                    <span className="text-[10px] px-2 py-0.5 bg-red-950 border border-red-900 text-red-400 font-bold uppercase rounded">
                                      Deshecho (REVERSADO)
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-200">{cmd.details}</p>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(cmd.fecha).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ================= MODALES DE CREACIÓN ================= */}
      {/* 1. REGISTRAR NUEVO LIBRO */}
      {showAddLibroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Libro en Catálogo</h3>
            
            <form onSubmit={handleCrearLibroManual} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Código ISBN</label>
                  <input
                    type="text"
                    required
                    value={nuevoLibro.isbn}
                    onChange={(e) => setNuevoLibro({ ...nuevoLibro, isbn: e.target.value })}
                    placeholder="978..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría</label>
                  <input
                    type="text"
                    required
                    value={nuevoLibro.categoria}
                    onChange={(e) => setNuevoLibro({ ...nuevoLibro, categoria: e.target.value })}
                    placeholder="Software, Novela, etc."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Título del Libro</label>
                <input
                  type="text"
                  required
                  value={nuevoLibro.titulo}
                  onChange={(e) => setNuevoLibro({ ...nuevoLibro, titulo: e.target.value })}
                  placeholder="Introducción a Patrones..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Autor(es)</label>
                <input
                  type="text"
                  required
                  value={nuevoLibro.autor}
                  onChange={(e) => setNuevoLibro({ ...nuevoLibro, autor: e.target.value })}
                  placeholder="Martín Fowler"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Editorial</label>
                  <input
                    type="text"
                    required
                    value={nuevoLibro.editorial}
                    onChange={(e) => setNuevoLibro({ ...nuevoLibro, editorial: e.target.value })}
                    placeholder="Addison-Wesley"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Año</label>
                  <input
                    type="number"
                    required
                    value={nuevoLibro.anio}
                    onChange={(e) => setNuevoLibro({ ...nuevoLibro, anio: Number(e.target.value) })}
                    placeholder="2026"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Stock de Ejemplares</label>
                <input
                  type="number"
                  required
                  value={nuevoLibro.stockTotal}
                  onChange={(e) => setNuevoLibro({ ...nuevoLibro, stockTotal: Number(e.target.value) })}
                  placeholder="3"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowAddLibroModal(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold rounded-lg text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold rounded-lg text-white"
                >
                  Registrar Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REGISTRAR PRESTAMO (BIBLIOTECARIO) */}
      {showAddPrestamoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Nuevo Préstamo</h3>
            
            <form onSubmit={handleCrearPrestamo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">ID del Socio</label>
                <input
                  type="text"
                  required
                  value={nuevoPrestamo.usuarioId}
                  onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, usuarioId: e.target.value })}
                  placeholder="Ej: f47ac10b..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Ingresa el ID del usuario estudiante, profesor o visitante.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">ID del Libro</label>
                <input
                  type="text"
                  required
                  value={nuevoPrestamo.libroId}
                  onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, libroId: e.target.value })}
                  placeholder="Ej: d8b09b0b..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nota Adicional (Opcional)</label>
                <textarea
                  value={nuevoPrestamo.nota}
                  onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, nota: e.target.value })}
                  placeholder="Notas de entrega, estado del libro..."
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowAddPrestamoModal(false)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold rounded-lg text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-bold rounded-lg text-white"
                >
                  Aprobar Préstamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper para deshacer en UI
  function handleDeshacerUltimaAccion() {
    handleDeshacerUltimoPrestamo();
  }
};

export default Dashboard;
