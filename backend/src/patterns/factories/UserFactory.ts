// src/patterns/factories/UserFactory.ts

export interface UserCreationData {
  nombre: string;
  email: string;
  passwordHash: string;
  telefono: string;
  tipo: 'estudiante' | 'profesor' | 'visitante';
  rol: 'ADMIN' | 'BIBLIOTECARIO' | 'SOCIO';
  estado: 'activo' | 'suspendido' | 'inactivo';
  multasPendientes: number;
}

export abstract class UserCreator {
  abstract factoryMethod(nombre: string, email: string, passwordHash: string, telefono: string, rol?: 'ADMIN' | 'BIBLIOTECARIO' | 'SOCIO'): UserCreationData;
}

export class EstudianteCreator extends UserCreator {
  factoryMethod(nombre: string, email: string, passwordHash: string, telefono: string, rol: 'ADMIN' | 'BIBLIOTECARIO' | 'SOCIO' = 'SOCIO'): UserCreationData {
    return {
      nombre,
      email,
      passwordHash,
      telefono,
      tipo: 'estudiante',
      rol,
      estado: 'activo',
      multasPendientes: 0.0
    };
  }
}

export class ProfesorCreator extends UserCreator {
  factoryMethod(nombre: string, email: string, passwordHash: string, telefono: string, rol: 'ADMIN' | 'BIBLIOTECARIO' | 'SOCIO' = 'SOCIO'): UserCreationData {
    return {
      nombre,
      email,
      passwordHash,
      telefono,
      tipo: 'profesor',
      rol,
      estado: 'activo',
      multasPendientes: 0.0
    };
  }
}

export class VisitanteCreator extends UserCreator {
  factoryMethod(nombre: string, email: string, passwordHash: string, telefono: string, rol: 'ADMIN' | 'BIBLIOTECARIO' | 'SOCIO' = 'SOCIO'): UserCreationData {
    return {
      nombre,
      email,
      passwordHash,
      telefono,
      tipo: 'visitante',
      rol,
      estado: 'activo',
      multasPendientes: 0.0
    };
  }
}

export class UserFactory {
  private static creators: Record<string, UserCreator> = {
    estudiante: new EstudianteCreator(),
    profesor: new ProfesorCreator(),
    visitante: new VisitanteCreator(),
  };

  static createUser(
    tipo: 'estudiante' | 'profesor' | 'visitante',
    nombre: string,
    email: string,
    passwordHash: string,
    telefono: string,
    rol?: 'ADMIN' | 'BIBLIOTECARIO' | 'SOCIO'
  ): UserCreationData {
    const creator = this.creators[tipo.toLowerCase()];
    if (!creator) {
      throw new Error(`Tipo de usuario desconocido: ${tipo}`);
    }
    return creator.factoryMethod(nombre, email, passwordHash, telefono, rol);
  }
}
