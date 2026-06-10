// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando proceso de semilla de base de datos...');

  // 1. Limpiar base de datos
  await prisma.multa.deleteMany();
  await prisma.prestamo.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.logAccion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.libro.deleteMany();

  console.log('Tablas limpias.');

  // 2. Crear libros
  const libros = [
    {
      isbn: '9780132350884',
      titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      autor: 'Robert C. Martin',
      editorial: 'Prentice Hall',
      anio: 2008,
      categoria: 'Software Engineering',
      stockTotal: 3,
      stockDisponible: 3,
      estado: 'disponible'
    },
    {
      isbn: '9780134494166',
      titulo: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      autor: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
      editorial: 'Addison-Wesley',
      anio: 1994,
      categoria: 'Software Architecture',
      stockTotal: 1, // Stock reducido a 1 para simular agotado rápido
      stockDisponible: 1,
      estado: 'disponible'
    },
    {
      isbn: '9780201616224',
      titulo: 'The Pragmatic Programmer: Your Journey to Mastery',
      autor: 'Andrew Hunt & David Thomas',
      editorial: 'Addison-Wesley',
      anio: 1999,
      categoria: 'Programming',
      stockTotal: 2,
      stockDisponible: 2,
      estado: 'disponible'
    },
    {
      isbn: '9788420658421',
      titulo: 'Don Quijote de la Mancha',
      autor: 'Miguel de Cervantes',
      editorial: 'Alianza Editorial',
      anio: 2005,
      categoria: 'Literatura Clásica',
      stockTotal: 4,
      stockDisponible: 4,
      estado: 'disponible'
    }
  ];

  for (const lib of libros) {
    await prisma.libro.create({ data: lib });
  }
  console.log('Libros sembrados.');

  // 3. Cifrar contraseñas para los usuarios semilla
  const salt = await bcrypt.genSalt(10);
  const passwordHashAdmin = await bcrypt.hash('admin123', salt);
  const passwordHashBiblio = await bcrypt.hash('biblio123', salt);
  const passwordHashEstud = await bcrypt.hash('estud123', salt);
  const passwordHashProf = await bcrypt.hash('prof123', salt);
  const passwordHashVisit = await bcrypt.hash('visit123', salt);

  // 4. Crear usuarios
  const usuarios = [
    {
      nombre: 'Administrador BiblioSys',
      email: 'admin@bibliosys.com',
      passwordHash: passwordHashAdmin,
      telefono: '809-555-0001',
      tipo: 'profesor',
      estado: 'activo',
      rol: 'ADMIN'
    },
    {
      nombre: 'Bibliotecaria Juana',
      email: 'bibliotecario@bibliosys.com',
      passwordHash: passwordHashBiblio,
      telefono: '809-555-0002',
      tipo: 'profesor',
      estado: 'activo',
      rol: 'BIBLIOTECARIO'
    },
    {
      nombre: 'Estudiante Juan Pérez',
      email: 'estudiante@bibliosys.com',
      passwordHash: passwordHashEstud,
      telefono: '829-555-1234',
      tipo: 'estudiante',
      estado: 'activo',
      rol: 'SOCIO'
    },
    {
      nombre: 'Profesor Dr. Carlos Ruiz',
      email: 'profesor@bibliosys.com',
      passwordHash: passwordHashProf,
      telefono: '809-555-5678',
      tipo: 'profesor',
      estado: 'activo',
      rol: 'SOCIO'
    },
    {
      nombre: 'Visitante María Gómez',
      email: 'visitante@bibliosys.com',
      passwordHash: passwordHashVisit,
      telefono: '849-555-9012',
      tipo: 'visitante',
      estado: 'activo',
      rol: 'SOCIO'
    }
  ];

  for (const usr of usuarios) {
    await prisma.usuario.create({ data: usr });
  }
  console.log('Usuarios sembrados.');

  console.log('Base de datos inicializada exitosamente con la semilla.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
