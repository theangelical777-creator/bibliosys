// src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Library, AlertTriangle, User, Mail, Phone, KeyRound, ArrowLeft } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState<'estudiante' | 'profesor' | 'visitante'>('estudiante');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.auth.register({
        nombre,
        email,
        password,
        telefono,
        tipo,
        rol: 'SOCIO' // Registro público es por defecto para socios
      });
      // Navegar a login tras registro exitoso
      navigate('/login', { state: { registered: true } });
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute -top-40 -left-45 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl glow-brand"></div>
      <div className="absolute -bottom-40 -right-45 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        <Link to="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al Login
        </Link>

        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand-500/20 flex items-center justify-center mb-3 text-brand-400">
            <Library className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Registro de Socio</h2>
          <p className="text-slate-400 mt-1">Crea tu cuenta de socio en BiblioSys</p>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-300">
              Nombre Completo
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="h-5 w-5" />
              </div>
              <input
                id="nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                className="block w-full pl-10 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Correo Electrónico
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@correo.com"
                className="block w-full pl-10 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-slate-300">
              Teléfono / Celular
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="h-5 w-5" />
              </div>
              <input
                id="telefono"
                type="text"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="809-555-1234"
                className="block w-full pl-10 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="h-5 w-5" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de Socio
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['estudiante', 'profesor', 'visitante'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border uppercase transition-all ${
                    tipo === t
                      ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-600/20'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              {tipo === 'estudiante' && 'Estudiante: Límite de 3 libros activos por 15 días.'}
              {tipo === 'profesor' && 'Profesor: Límite de 10 libros activos por 60 días (exento de multas iniciales).'}
              {tipo === 'visitante' && 'Visitante: Límite de 1 libro activo por 7 días.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-600/20"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
