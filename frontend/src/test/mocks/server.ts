import { setupServer } from 'msw/node';

/** Servidor MSW de las pruebas: cada prueba agrega sus handlers con `server.use(...)`. */
export const server = setupServer();
