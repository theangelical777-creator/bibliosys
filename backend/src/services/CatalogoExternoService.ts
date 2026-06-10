// src/services/CatalogoExternoService.ts
import { CatalogoAdapter, InternalBookData } from '../patterns/adapters/CatalogoAdapter';

export class CatalogoExternoService {
  /**
   * Busca un libro por ISBN en Open Library API y lo adapta al formato interno.
   * Si falla, arroja un error o retorna un mock de ejemplo.
   */
  async buscarPorIsbn(isbn: string): Promise<InternalBookData> {
    const cleanIsbn = isbn.trim().replace(/-/g, '');
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;

    try {
      // Usar fetch nativo de Node.js (disponible en Node 18+)
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al conectar con Open Library API');
      }
      
      const data: any = await response.json();
      const key = `ISBN:${cleanIsbn}`;

      if (data && data[key]) {
        const externalBook = data[key];
        return CatalogoAdapter.adaptExternalToInternal(externalBook, isbn);
      } else {
        // Fallback mock en caso de que no exista el ISBN en Open Library
        return this.generarLibroMock(isbn);
      }
    } catch (error) {
      console.warn('[CatalogoExternoService] Falló la API externa. Retornando mock de respaldo:', error);
      return this.generarLibroMock(isbn);
    }
  }

  private generarLibroMock(isbn: string): InternalBookData {
    // Generar datos ficticios pero coherentes basados en un listado interno
    const mocks: Record<string, { titulo: string, autor: string, editorial: string, categoria: string }> = {
      '9780132350884': {
        titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        autor: 'Robert C. Martin',
        editorial: 'Prentice Hall',
        categoria: 'Software Engineering'
      },
      '9780201616224': {
        titulo: 'The Pragmatic Programmer: Your Journey to Mastery',
        autor: 'Andrew Hunt & David Thomas',
        editorial: 'Addison-Wesley',
        categoria: 'Programming'
      },
      '9780134494166': {
        titulo: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        autor: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        editorial: 'Addison-Wesley',
        categoria: 'Software Architecture'
      }
    };

    const clean = isbn.trim().replace(/-/g, '');
    const item = mocks[clean] || {
      titulo: `Libro Importado (${isbn})`,
      autor: 'Autor Desconocido',
      editorial: 'Editorial Local',
      categoria: 'General'
    };

    return {
      isbn,
      titulo: item.titulo,
      autor: item.autor,
      editorial: item.editorial,
      anio: 2020,
      categoria: item.categoria,
      stockTotal: 5,
      stockDisponible: 5,
      estado: 'disponible'
    };
  }
}
