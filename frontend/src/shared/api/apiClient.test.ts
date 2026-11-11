import { http, HttpResponse } from 'msw';
import { apiClient } from '@/shared/api/apiClient';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { useAuthStore } from '@/features/auth/store/authStore';
import { server } from '@/test/mocks/server';

const API = 'http://localhost:8080/api';

describe('apiClient', () => {
  it('agrega el token JWT en la cabecera Authorization', async () => {
    let authorization: string | null = null;
    server.use(
      http.get(`${API}/ping`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({});
      }),
    );
    useAuthStore.getState().setSession('abc123', {
      id: 1,
      firstName: 'A',
      lastName: 'B',
      email: 'test@epcc.unsa.edu.pe',
      role: 'ADMIN',
    });

    await apiClient.get('/ping');

    expect(authorization).toBe('Bearer abc123');
  });

  it('cierra la sesión cuando el backend responde 401', async () => {
    server.use(http.get(`${API}/ping`, () => new HttpResponse(null, { status: 401 })));
    useAuthStore.getState().setSession('vencido', {
      id: 1,
      firstName: 'A',
      lastName: 'B',
      email: 'test@epcc.unsa.edu.pe',
      role: 'ADMIN',
    });

    await expect(apiClient.get('/ping')).rejects.toBeDefined();

    expect(useAuthStore.getState().token).toBeNull();
  });

  it('extrae el mensaje en español de un ProblemDetail', async () => {
    server.use(
      http.get(`${API}/ping`, () =>
        HttpResponse.json(
          { status: 409, detail: 'El usuario tiene una sanción activa' },
          { status: 409 },
        ),
      ),
    );

    const error = await apiClient.get('/ping').catch((e: unknown) => e);

    expect(getErrorMessage(error)).toBe('El usuario tiene una sanción activa');
  });
});
