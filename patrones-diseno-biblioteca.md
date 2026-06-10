# Patrones de Diseño — Sistema de Gestión de Biblioteca con Préstamos

**Proyecto:** Gestión de Biblioteca con Préstamos  
**Versión:** 1.0  
**Fecha:** Junio 2026

---

## 1. Visión General del Sistema

El sistema gestiona libros, usuarios/socios, y el ciclo completo de préstamos: solicitud, entrega, devolución, multas y reservas. A continuación se documentan los patrones de diseño aplicados a cada capa de la aplicación.

---

## 2. Patrones Creacionales

### 2.1 Factory Method — Creación de Tipos de Usuario

**Problema:** El sistema maneja distintos tipos de usuarios (Estudiante, Profesor, Visitante) con distintos límites de préstamo y plazos.

**Solución:**

```
UserFactory
  ├── createUser(tipo: string): Usuario
  ├── EstudianteFactory  → maxPrestamos: 3, plazo: 15 días
  ├── ProfesorFactory    → maxPrestamos: 10, plazo: 60 días
  └── VisitanteFactory   → maxPrestamos: 1, plazo: 7 días
```

**Aplicación:** Al registrar un nuevo socio, el controlador llama a `UserFactory.createUser("estudiante")` sin conocer la lógica interna de cada tipo.

---

### 2.2 Singleton — Gestor de Configuración Global

**Problema:** Los parámetros del sistema (días de gracia, monto de multas, horarios) deben ser únicos y consistentes en toda la app.

**Solución:**

```
class BibliotecaConfig {
  private static instancia: BibliotecaConfig
  - diasGracia: number = 3
  - multaPorDia: number = 5.00
  - maxRenovaciones: number = 2

  static getInstance(): BibliotecaConfig
}
```

**Aplicación:** `BibliotecaConfig.getInstance().multaPorDia` es accedido por el módulo de multas sin instanciar nuevos objetos.

---

### 2.3 Builder — Construcción de Préstamo

**Problema:** Un préstamo requiere múltiples atributos opcionales (renovaciones, notas, reserva previa, tipo de entrega).

**Solución:**

```
PrestamoBuilder
  .setLibro(libro)
  .setUsuario(usuario)
  .setFechaVencimiento(fecha)
  .setRenovaciones(0)
  .setNota("Préstamo urgente")
  .build(): Prestamo
```

**Aplicación:** El servicio de préstamos usa el builder para construir objetos `Prestamo` complejos sin constructores sobrecargados.

---

## 3. Patrones Estructurales

### 3.1 Repository — Acceso a Datos

**Problema:** La lógica de negocio no debe acoplarse a la base de datos directamente.

**Solución:**

```
interface LibroRepository {
  findById(id): Libro
  findByISBN(isbn): Libro
  findDisponibles(): Libro[]
  save(libro): void
  delete(id): void
}

class LibroRepositorySQL implements LibroRepository { ... }
class LibroRepositoryMongo implements LibroRepository { ... }
```

**Aplicación:** El servicio `PrestamoService` usa `LibroRepository` sin saber si la BD es SQL o NoSQL.

---

### 3.2 Decorator — Validaciones en Préstamos

**Problema:** Sobre un préstamo básico se deben aplicar validaciones opcionales: límite de libros, estado de multas, disponibilidad.

**Solución:**

```
PrestamoServiceBase
  └── ValidacionLimiteDecorator
        └── ValidacionMultaDecorator
              └── ValidacionDisponibilidadDecorator
                    → .procesarPrestamo(usuario, libro)
```

**Aplicación:** Se encadenan decoradores según el contexto. Para un visitante solo se aplica `ValidacionDisponibilidad`, para un estudiante los tres.

---

### 3.3 Adapter — Integración con Sistema Externo de Catálogo

**Problema:** El catálogo nacional de libros tiene una API propia con formato diferente al modelo interno.

**Solución:**

```
CatalogoNacionalAPI          SistemaInterno
 .buscarObra(titulo)   →   LibroAdapter.buscar(titulo)
 .getISBN()            →   .isbn
 .getTitulo()          →   .titulo
 .getAutores()         →   .autores[]
```

**Aplicación:** `LibroAdapter` traduce la respuesta de la API externa al modelo `Libro` interno sin modificar ninguna de las dos partes.

---

### 3.4 Facade — Fachada de Proceso de Préstamo

**Problema:** El proceso de préstamo involucra: validar usuario, verificar disponibilidad, registrar préstamo, actualizar stock, notificar.

**Solución:**

```
class PrestamofFacade {
  realizarPrestamo(usuarioId, libroId) {
    1. usuarioService.validar(usuarioId)
    2. libroService.verificarDisponibilidad(libroId)
    3. prestamoService.registrar(usuarioId, libroId)
    4. inventarioService.reducirStock(libroId)
    5. notificacionService.enviarConfirmacion(usuarioId)
  }
}
```

**Aplicación:** El controlador HTTP solo llama `PrestamofFacade.realizarPrestamo(...)` y delega toda la complejidad.

---

## 4. Patrones de Comportamiento

### 4.1 Observer — Notificaciones de Eventos

**Problema:** Cuando un libro es devuelto, se debe notificar a usuarios en lista de espera, actualizar inventario, y registrar en auditoría.

**Solución:**

```
EventEmitter (Observable)
  └── evento: "libro_devuelto"
        ├── ListaEsperaObserver  → notifica al siguiente en cola
        ├── InventarioObserver   → actualiza disponibilidad
        └── AuditoriaObserver    → registra log del evento
```

**Aplicación:** Al ejecutar `devolucionService.procesar(prestamoId)`, se emite el evento y cada observer reacciona de forma independiente.

---

### 4.2 State — Estado del Préstamo

**Problema:** Un préstamo pasa por múltiples estados con transiciones bien definidas.

**Solución:**

```
Estado del Préstamo:
  PENDIENTE → ACTIVO → VENCIDO → DEVUELTO
                 ↓
             RENOVADO → ACTIVO

Clase Prestamo {
  estado: EstadoPrestamo
  .renovar()   // solo si estado=ACTIVO y renovaciones < max
  .vencer()    // si fecha > hoy
  .devolver()  // marca DEVUELTO, calcula multa si aplica
}
```

**Aplicación:** La lógica de transiciones vive en cada clase de estado, evitando grandes bloques `if/else` en el servicio.

---

### 4.3 Strategy — Cálculo de Multas

**Problema:** El cálculo de multa varía según el tipo de usuario y el tipo de material (libro, revista, tesis).

**Solución:**

```
interface MultaStrategy {
  calcular(diasRetraso: number): number
}

MultaEstudianteStrategy  → RD$ 5 x día
MultaProfesorStrategy    → RD$ 0 (exento hasta 5 días)
MultaVisitanteStrategy   → RD$ 15 x día
MultaRevistasStrategy    → RD$ 2 x día (cualquier usuario)
```

**Aplicación:** `MultaService.calcular(prestamo)` selecciona la estrategia correcta según `usuario.tipo` y `libro.categoria`.

---

### 4.4 Command — Acciones Reversibles (Undo)

**Problema:** Las acciones críticas (registrar préstamo, eliminar socio) deben poder revertirse.

**Solución:**

```
interface Command {
  execute(): void
  undo(): void
}

RegistrarPrestamoCommand
  .execute()  → crea préstamo, reduce stock
  .undo()     → elimina préstamo, restaura stock

CommandHistory [ cmd1, cmd2, cmd3 ]
  .deshacer() → cmd3.undo()
```

**Aplicación:** El panel de administración mantiene un `CommandHistory` que permite revertir las últimas N acciones.

---

### 4.5 Chain of Responsibility — Aprobación de Solicitudes

**Problema:** Una solicitud de préstamo debe pasar por múltiples niveles de validación antes de aprobarse.

**Solución:**

```
SolicitudPrestamo
  → ValidadorSaldo (¿tiene multas pendientes?)
      → ValidadorLimite (¿excede su cuota?)
          → ValidadorDisponibilidad (¿el libro está en stock?)
              → AprobadorFinal → APROBADO ✓
```

**Aplicación:** Cada validador decide si pasa la solicitud al siguiente eslabón o la rechaza con un mensaje específico.

---

## 5. Patrones de Arquitectura

### 5.1 MVC (Modelo-Vista-Controlador)

```
┌─────────────────────────────────────────────┐
│  VISTA (Frontend)                           │
│  React / HTML — Formularios, tablas, UI     │
└──────────────┬──────────────────────────────┘
               │ HTTP Request
┌──────────────▼──────────────────────────────┐
│  CONTROLADOR                                │
│  LibroController, PrestamoController,       │
│  UsuarioController                          │
└──────────────┬──────────────────────────────┘
               │ llama a Servicios
┌──────────────▼──────────────────────────────┐
│  MODELO (Servicios + Repositorios)          │
│  PrestamoService, LibroService              │
│  LibroRepository, UsuarioRepository         │
└──────────────┬──────────────────────────────┘
               │ consulta
┌──────────────▼──────────────────────────────┐
│  BASE DE DATOS                              │
│  MySQL / PostgreSQL                         │
└─────────────────────────────────────────────┘
```

---

### 5.2 Estructura de Capas Recomendada

```
src/
├── controllers/          ← Capa HTTP (rutas, request/response)
│   ├── LibroController.ts
│   ├── PrestamoController.ts
│   └── UsuarioController.ts
│
├── services/             ← Lógica de negocio
│   ├── PrestamoService.ts
│   ├── MultaService.ts
│   └── NotificacionService.ts
│
├── repositories/         ← Acceso a datos (patrón Repository)
│   ├── LibroRepository.ts
│   └── PrestamoRepository.ts
│
├── models/               ← Entidades del dominio
│   ├── Libro.ts
│   ├── Usuario.ts
│   └── Prestamo.ts
│
├── patterns/             ← Implementaciones de patrones
│   ├── factories/
│   ├── observers/
│   ├── strategies/
│   └── commands/
│
├── config/               ← Singleton de configuración
│   └── BibliotecaConfig.ts
│
└── facades/              ← Fachadas de procesos complejos
    └── PrestamoFacade.ts
```

---

## 6. Resumen de Patrones Aplicados

| Patrón | Categoría | Dónde se aplica |
|---|---|---|
| Factory Method | Creacional | Creación de tipos de usuario |
| Singleton | Creacional | Configuración global del sistema |
| Builder | Creacional | Construcción de objetos Préstamo |
| Repository | Estructural | Acceso a datos (Libro, Usuario, Préstamo) |
| Decorator | Estructural | Validaciones encadenadas en préstamos |
| Adapter | Estructural | Integración con catálogo externo |
| Facade | Estructural | Proceso completo de préstamo |
| Observer | Comportamiento | Notificaciones de devoluciones |
| State | Comportamiento | Ciclo de vida del préstamo |
| Strategy | Comportamiento | Cálculo de multas por tipo de usuario |
| Command | Comportamiento | Acciones reversibles en administración |
| Chain of Responsibility | Comportamiento | Aprobación de solicitudes de préstamo |

---

*Documento generado para el proyecto: Gestión de Biblioteca con Préstamos*
