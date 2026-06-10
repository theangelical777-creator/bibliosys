// src/patterns/adapters/CatalogoAdapter.ts

export interface ExternalBookResponse {
  title: string;
  authors?: Array<{ name: string }> | string[];
  publishers?: string[];
  publish_date?: string;
  isbn_13?: string[];
  isbn_10?: string[];
  subjects?: string[] | Array<{ name: string }>;
}

export interface InternalBookData {
  isbn: string;
  titulo: string;
  autor: string;
  editorial: string;
  anio: number;
  categoria: string;
  stockTotal: number;
  stockDisponible: number;
  estado: 'disponible' | 'agotado' | 'de_baja';
}

export class CatalogoAdapter {
  static adaptExternalToInternal(external: ExternalBookResponse, isbn: string): InternalBookData {
    // Extraer autor
    let autor = 'Autor Desconocido';
    if (external.authors && external.authors.length > 0) {
      const firstAuthor = external.authors[0];
      if (typeof firstAuthor === 'string') {
        autor = firstAuthor;
      } else if (typeof firstAuthor === 'object' && firstAuthor.name) {
        autor = firstAuthor.name;
      }
    }

    // Extraer editorial
    let editorial = 'Editorial Desconocida';
    if (external.publishers && external.publishers.length > 0) {
      editorial = external.publishers[0];
    }

    // Extraer año de publicación
    let anio = new Date().getFullYear();
    if (external.publish_date) {
      // Intentar extraer el año con regex
      const match = external.publish_date.match(/\d{4}/);
      if (match) {
        anio = parseInt(match[0], 10);
      }
    }

    // Extraer categoría
    let categoria = 'General';
    if (external.subjects && external.subjects.length > 0) {
      const firstSubject = external.subjects[0];
      if (typeof firstSubject === 'string') {
        categoria = firstSubject;
      } else if (typeof firstSubject === 'object' && (firstSubject as any).name) {
        categoria = (firstSubject as any).name;
      }
    }

    return {
      isbn: isbn,
      titulo: external.title || 'Título Desconocido',
      autor: autor,
      editorial: editorial,
      anio: anio,
      categoria: categoria,
      stockTotal: 3, // Stock inicial por defecto al importar
      stockDisponible: 3,
      estado: 'disponible'
    };
  }
}
