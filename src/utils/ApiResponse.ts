import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Succès', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  static created<T>(res: Response, data: T, message = 'Créé avec succès') {
    return res.status(201).json({ success: true, message, data });
  }

  static paginated<T>(res: Response, data: T[], meta: PaginationMeta, message = 'Succès') {
    return res.status(200).json({ success: true, message, data, meta });
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}

// Calcul de pagination
export function getPagination(page = 1, limit = 20) {
  const take = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (Math.max(Number(page), 1) - 1) * take;
  return { skip, take };
}

export function getPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };
}
