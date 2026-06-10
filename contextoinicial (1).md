# Contexto Inicial — Sistema de Gestión de Biblioteca con Préstamos

**Proyecto:** BiblioSys  
**Tipo:** Aplicación Web Full-Stack  
**Estado:** Inicio de desarrollo  
**Fecha:** Junio 2026

---

## 1. Descripción del Proyecto

Sistema web para la gestión integral de una biblioteca: catálogo de libros, registro de socios, control de préstamos, devoluciones, reservas y multas. El sistema debe permitir a los administradores gestionar el inventario y a los socios consultar disponibilidad y su historial de préstamos.

---

## 2. Objetivos Principales

- Digitalizar el registro manual de préstamos y devoluciones
- Controlar el inventario de libros en tiempo real
- Automatizar el cálculo de multas por atraso
- Permitir reservas anticipadas de libros no disponibles
- Generar reportes de uso y estadísticas de la biblioteca

---

## 3. Entidades del Dominio

### Libro
- `id`, `isbn`, `titulo`, `autor`, `editorial`, `anio`, `categoria`
- `stock_total`, `stock_disponible`
- `estado`: disponible | agotado | de_baja

### Usuario / Socio
- `id`, `nombre`, `email`, `telefono`, `tipo`
- `tipo`: estudiante | profesor | visitante
- `estado`: activo | suspendido | inactivo
- `fecha_registro`, `multas_pendientes`

### Préstamo
- `id`, `libro_id`, `usuario_id`
- `fecha_prestamo`, `fecha_vencimiento`, `fecha_devolucion`
- `estado`: pendiente | activo | vencido | renovado | devuelto
- `renovaciones`, `nota`

### Multa
- `id`, `prestamo_id`, `usuario_id`
- `dias_retraso`, `monto`, `estado`: pendiente | pagada

### Reserva
- `id`, `libro_id`, `usuario_id`, `fecha_reserva`
- `estado`: en_espera | notificado | cancelado | completado

---

## 4. Reglas de Negocio

| Regla | Detalle |
|---|---|
| Límite de préstamos | Estudiante: 3 · Profesor: 10 · Visitante: 1 |
| Plazo de préstamo | Estudiante: 15 días · Profesor: 60 días · Visitante: 7 días |
| Renovaciones permitidas | Máximo 2 por préstamo |
| Días de gracia | 3 días antes de generar multa |
| Monto de multa | Estudiante: RD$5/día · Visitante: RD$15/día · Profesor: exento 5 días |
| Bloqueo por multa | Usuario suspendido si multa supera RD$200 |

---

## 5. Stack Tecnológico (Propuesto)

```
Frontend:   React + TypeScript + Tailwind CSS
Backend:    Node.js + Express (o NestJS)
Base de datos: PostgreSQL
ORM:        Prisma (o TypeORM)
Auth:       JWT + Bcrypt
Testing:    Jest + Supertest
```

---

## 6. Patrones de Diseño Aplicados

| Patrón | Uso principal |
|---|---|
| Factory Method | Creación de tipos de usuario |
| Singleton | Configuración global (multas, plazos) |
| Builder | Construcción de objetos Préstamo |
| Repository | Acceso a datos desacoplado |
| Decorator | Validaciones encadenadas en préstamos |
| Adapter | Integración con catálogo externo |
| Facade | Proceso completo de préstamo |
| Observer | Notificaciones de devoluciones |
| State | Ciclo de vida del préstamo |
| Strategy | Cálculo de multas por tipo de usuario |
| Command | Acciones reversibles en admin |
| Chain of Responsibility | Aprobación de solicitudes |

> Ver documento completo: `patrones-diseno-biblioteca.md`

---

## 7. Estructura de Carpetas del Proyecto

```
bibliotecasys/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── services/
    │   ├── repositories/
    │   ├── models/
    │   ├── patterns/
    │   │   ├── factories/
    │   │   ├── observers/
    │   │   ├── strategies/
    │   │   └── commands/
    │   ├── facades/
    │   └── config/
    ├── prisma/
    │   └── schema.prisma
    └── package.json
```

---

## 8. Módulos del Sistema

1. **Módulo de Catálogo** — CRUD de libros, búsqueda, categorías
2. **Módulo de Socios** — Registro, tipos, estado de cuenta
3. **Módulo de Préstamos** — Solicitud, aprobación, renovación, devolución
4. **Módulo de Multas** — Cálculo automático, pagos, historial
5. **Módulo de Reservas** — Lista de espera, notificaciones
6. **Módulo de Reportes** — Estadísticas, libros más prestados, morosos
7. **Módulo de Auth** — Login, roles, permisos

---

## 9. Roles y Permisos

| Rol | Permisos |
|---|---|
| Administrador | Acceso total: gestión libros, usuarios, reportes, configuración |
| Bibliotecario | Gestión de préstamos, devoluciones, multas |
| Socio | Consulta catálogo, ver historial propio, hacer reservas |

---

## 10. Próximos Pasos

- [ ] Diseño del esquema de base de datos (Prisma schema)
- [ ] Configuración del entorno de desarrollo
- [ ] Implementar módulo de Auth (JWT)
- [ ] Implementar repositorios base (Repository pattern)
- [ ] Implementar Factory Method para usuarios
- [ ] Implementar módulo de Préstamos con State pattern
- [ ] Implementar Strategy de multas
- [ ] Frontend: componentes de catálogo y formularios

---

*BiblioSys — Contexto Inicial del Proyecto*
