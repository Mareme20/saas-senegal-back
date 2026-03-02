import { ApiError } from '../utils/ApiError';

describe('ApiError', () => {
  it('crée une erreur 404', () => {
    const err = ApiError.notFound('Introuvable');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Introuvable');
    expect(err.isOperational).toBe(true);
  });

  it('crée une erreur 401', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
  });

  it('crée une erreur 400 avec détails', () => {
    const err = ApiError.badRequest('Invalide', { champ: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ champ: 'email' });
  });
});
