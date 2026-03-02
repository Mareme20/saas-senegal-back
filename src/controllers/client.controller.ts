import { NextFunction, Request, Response } from 'express';
import { createClientSchema, listClientsQuerySchema, updateClientSchema } from '../dtos/client.dto';
import { clientService } from '../services/client.service';
import { ApiResponse } from '../utils/ApiResponse';

export class ClientController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listClientsQuerySchema.parse(req.query);
      const r = await clientService.findAll(req.user!.entrepriseId, query);
      ApiResponse.paginated(res, r.clients, r.meta);
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await clientService.findById(req.params.id, req.user!.entrepriseId));
    } catch (e) { next(e); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createClientSchema.parse(req.body);
      ApiResponse.created(res, await clientService.create(req.user!.entrepriseId, data), 'Client créé');
    } catch (e) { next(e); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateClientSchema.parse(req.body);
      ApiResponse.success(res, await clientService.update(req.params.id, req.user!.entrepriseId, data), 'Client mis à jour');
    } catch (e) { next(e); }
  }
}
