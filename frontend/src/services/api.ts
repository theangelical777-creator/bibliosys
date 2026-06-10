const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(response: Response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { error: text || 'Error de red' };
  }

  if (!response.ok) {
    throw new Error(data.error || 'Algo salió mal en el servidor.');
  }
  return data;
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
      }
      return data;
    },
    register: async (userData: any) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE}/usuarios/me`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  libros: {
    list: async (searchQuery?: string) => {
      const url = searchQuery ? `${API_BASE}/libros?q=${encodeURIComponent(searchQuery)}` : `${API_BASE}/libros`;
      const res = await fetch(url, { headers: getHeaders() });
      return handleResponse(res);
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_BASE}/libros/${id}`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (data: any) => {
      const res = await fetch(`${API_BASE}/libros`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_BASE}/libros/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE}/libros/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    importByIsbn: async (isbn: string) => {
      const res = await fetch(`${API_BASE}/libros/importar/${isbn}`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  prestamos: {
    list: async () => {
      const res = await fetch(`${API_BASE}/prestamos`, { headers: getHeaders() });
      return handleResponse(res);
    },
    listMine: async () => {
      const res = await fetch(`${API_BASE}/prestamos/mis-prestamos`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (usuarioId: string, libroId: string, nota?: string) => {
      const res = await fetch(`${API_BASE}/prestamos`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ usuarioId, libroId, nota })
      });
      return handleResponse(res);
    },
    devolver: async (id: string) => {
      const res = await fetch(`${API_BASE}/prestamos/${id}/devolver`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    renovar: async (id: string) => {
      const res = await fetch(`${API_BASE}/prestamos/${id}/renovar`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    undo: async () => {
      const res = await fetch(`${API_BASE}/prestamos/deshacer`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${API_BASE}/prestamos/historial-acciones`, { headers: getHeaders() });
      return handleResponse(res);
    }
  },

  multas: {
    list: async () => {
      const res = await fetch(`${API_BASE}/multas`, { headers: getHeaders() });
      return handleResponse(res);
    },
    listMine: async () => {
      const res = await fetch(`${API_BASE}/multas/mis-multas`, { headers: getHeaders() });
      return handleResponse(res);
    },
    pagar: async (id: string) => {
      const res = await fetch(`${API_BASE}/multas/${id}/pagar`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  reservas: {
    list: async () => {
      const res = await fetch(`${API_BASE}/reservas`, { headers: getHeaders() });
      return handleResponse(res);
    },
    listMine: async () => {
      const res = await fetch(`${API_BASE}/reservas/mis-reservas`, { headers: getHeaders() });
      return handleResponse(res);
    },
    create: async (libroId: string) => {
      const res = await fetch(`${API_BASE}/reservas`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ libroId })
      });
      return handleResponse(res);
    },
    cancelar: async (id: string) => {
      const res = await fetch(`${API_BASE}/reservas/${id}/cancelar`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  usuarios: {
    list: async () => {
      const res = await fetch(`${API_BASE}/usuarios`, { headers: getHeaders() });
      return handleResponse(res);
    }
  }
};
