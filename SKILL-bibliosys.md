---
name: bibliosys
description: >
  Skill para el desarrollo del proyecto BiblioSys: Sistema de Gestión de Biblioteca con Préstamos.
  Activa esta skill siempre que el usuario mencione BiblioSys, biblioteca, préstamos de libros,
  gestión de socios, multas de biblioteca, reservas de libros, catálogo de libros, o cualquier
  tarea de desarrollo relacionada con este proyecto. Cubre: implementación de patrones de diseño
  (Factory, Singleton, Builder, Repository, Decorator, Adapter, Facade, Observer, State, Strategy,
  Command, Chain of Responsibility), generación de código TypeScript por capas (controllers,
  services, repositories, models, patterns, facades), esquemas Prisma, componentes React,
  endpoints REST, y reglas de negocio del sistema. Úsala también cuando el usuario pida
  generar, revisar o refactorizar cualquier parte del código de BiblioSys.
---

# BiblioSys — Skill de Desarrollo

Sistema de Gestión de Biblioteca con Préstamos. Esta skill contiene todo el contexto necesario para que Claude genere código correcto, coherente y alineado con la arquitectura del proyecto.

---

## Contexto del Proyecto

**Nombre:** BiblioSys  
**Tipo:** Aplicación Web Full-Stack  
**Stack:** React + TypeScript / Node.js + Express (o NestJS) / PostgreSQL + Prisma / JWT

---

## Entidades del Dominio

```typescript
// Libro
interface Libro {
  id: string
  isbn: string
  titulo: string
  autor: string
  editorial: string
  anio: number
  categoria: string
  stockTotal: number
  stockDisponible: number
  estado: 'disponible' | 'agotado' | 'de_baja'
}

// Usuario
interface Usuario {
  id: string
  nombre: string
  email: string
  telefono: string
  tipo: 'estudiante' | 'profesor' | 'visitante'
  estado: 'activo' | 'suspendido' | 'inactivo'
  multasPendientes: number
  fechaRegistro: Date
}

// Préstamo
interface Prestamo {
  id: string
  libroId: string
  usuarioId: string
  fechaPrestamo: Date
  fechaVencimiento: Date
  fechaDevolucion?: Date
  estado: 'pendiente' | 'activo' | 'vencido' | 'renovado' | 'devuelto'
  renovaciones: number
  nota?: string
}

// Multa
interface Multa {
  id: string
  prestamoId: string
  usuarioId: string
  diasRetraso: number
  monto: number
  estado: 'pendiente' | 'pagada'
}

// Reserva
interface Reserva {
  id: string
  libroId: string
  usuarioId: string
  fechaReserva: Date
  estado: 'en_espera' | 'notificado' | 'cancelado' | 'completado'
}
```

---

## Reglas de Negocio

| Regla | Valor |
|---|---|
| Límite estudiante | 3 libros, 15 días |
| Límite profesor | 10 libros, 60 días |
| Límite visitante | 1 libro, 7 días |
| Renovaciones máx | 2 por préstamo |
| Días de gracia | 3 días |
| Multa estudiante | RD$5 / día |
| Multa visitante | RD$15 / día |
| Multa profesor | Exento primeros 5 días |
| Suspensión | Multa > RD$200 |

---

## Patrones de Diseño y su Ubicación

| Patrón | Archivo / Ruta |
|---|---|
| Factory Method | `src/patterns/factories/UserFactory.ts` |
| Singleton | `src/config/BibliotecaConfig.ts` |
| Builder | `src/patterns/builders/PrestamoBuilder.ts` |
| Repository | `src/repositories/*.ts` |
| Decorator | `src/patterns/decorators/ValidacionDecorator.ts` |
| Adapter | `src/patterns/adapters/CatalogoAdapter.ts` |
| Facade | `src/facades/PrestamoFacade.ts` |
| Observer | `src/patterns/observers/DevolucionObserver.ts` |
| State | `src/patterns/states/PrestamoState.ts` |
| Strategy | `src/patterns/strategies/MultaStrategy.ts` |
| Command | `src/patterns/commands/PrestamoCommand.ts` |
| Chain of Responsibility | `src/patterns/chains/ValidacionChain.ts` |

---

## Estructura de Carpetas

```
backend/src/
├── controllers/          ← HTTP: rutas, request/response
├── services/             ← Lógica de negocio
├── repositories/         ← Acceso a datos (Repository pattern)
├── models/               ← Tipos e interfaces del dominio
├── patterns/
│   ├── factories/
│   ├── builders/
│   ├── decorators/
│   ├── adapters/
│   ├── observers/
│   ├── states/
│   ├── strategies/
│   ├── commands/
│   └── chains/
├── facades/
└── config/

frontend/src/
├── components/
├── pages/
├── hooks/
└── services/             ← llamadas al API
```

---

## Guía de Generación de Código

### Al implementar un patrón:
1. Mostrar primero la interfaz o clase abstracta
2. Implementar las clases concretas
3. Mostrar cómo lo consume el service correspondiente
4. Mostrar el punto de entrada desde el controller (si aplica)

### Al crear un endpoint REST:
Seguir siempre el flujo: `Controller → Service → Repository → BD`
- Controller: validación de entrada, manejo HTTP
- Service: lógica de negocio, orquestación de patrones
- Repository: queries a Prisma, sin lógica de negocio

### Al crear un componente React:
- TypeScript estricto
- Tailwind CSS para estilos
- Lógica separada en custom hooks (`useLibros`, `usePrestamo`, etc.)
- Mostrar estados: cargando, error, éxito

### Siempre incluir:
- Tipos TypeScript correctos
- Manejo de errores con try/catch
- Comentarios en secciones clave
- Ejemplo de uso al final del código

---

## Módulos del Sistema

1. **Catálogo** — CRUD libros, búsqueda, categorías
2. **Socios** — Registro, tipos, estado de cuenta
3. **Préstamos** — Solicitud → Aprobación → Renovación → Devolución
4. **Multas** — Cálculo automático, pagos, historial
5. **Reservas** — Lista de espera, notificaciones
6. **Reportes** — Estadísticas, libros más prestados
7. **Auth** — Login, roles (Admin / Bibliotecario / Socio), JWT

---

## Snippet de Referencia: BibliotecaConfig (Singleton)

```typescript
// src/config/BibliotecaConfig.ts
export class BibliotecaConfig {
  private static instancia: BibliotecaConfig

  readonly diasGracia = 3
  readonly maxRenovaciones = 2
  readonly multaSuspension = 200

  readonly plazos = {
    estudiante: 15,
    profesor: 60,
    visitante: 7,
  }

  readonly limites = {
    estudiante: 3,
    profesor: 10,
    visitante: 1,
  }

  readonly multas = {
    estudiante: 5,
    profesor: 0,
    visitante: 15,
  }

  private constructor() {}

  static getInstance(): BibliotecaConfig {
    if (!this.instancia) this.instancia = new BibliotecaConfig()
    return this.instancia
  }
}
```

---

## Snippet de Referencia: PrestamoFacade

```typescript
// src/facades/PrestamoFacade.ts
export class PrestamoFacade {
  constructor(
    private usuarioService: UsuarioService,
    private libroService: LibroService,
    private prestamoService: PrestamoService,
    private inventarioService: InventarioService,
    private notificacionService: NotificacionService,
  ) {}

  async realizarPrestamo(usuarioId: string, libroId: string): Promise<Prestamo> {
    await this.usuarioService.validar(usuarioId)
    await this.libroService.verificarDisponibilidad(libroId)
    const prestamo = await this.prestamoService.registrar(usuarioId, libroId)
    await this.inventarioService.reducirStock(libroId)
    await this.notificacionService.enviarConfirmacion(usuarioId)
    return prestamo
  }
}
```

---

*BiblioSys Skill v1.0 — Junio 2026*
