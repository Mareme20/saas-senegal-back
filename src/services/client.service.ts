import { CreateClientDto, ListClientsQueryDto, UpdateClientDto } from '../dtos/client.dto';
import { TypeOrmClientRepository } from '../repositories/implementations';
import { IClientRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';
import { getPaginationMeta } from '../utils/ApiResponse';

export class ClientService {
  constructor(private readonly clientRepository: IClientRepository) {}

  async findAll(entrepriseId: string, query: ListClientsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const result = await this.clientRepository.findAll({
      entrepriseId,
      page,
      limit,
      search: query.search,
    });

    return {
      clients: result.data,
      meta: getPaginationMeta(result.total, page, limit),
    };
  }

  async findById(id: string, entrepriseId: string) {
    const client = await this.clientRepository.findById(id, entrepriseId);
    if (!client) throw ApiError.notFound('Client introuvable');
    return client;
  }

  create(entrepriseId: string, payload: CreateClientDto) {
    return this.clientRepository.create(entrepriseId, payload);
  }

  async update(id: string, entrepriseId: string, payload: UpdateClientDto) {
    const client = await this.clientRepository.update(id, entrepriseId, payload);
    if (!client) throw ApiError.notFound('Client introuvable');
    return client;
  }
}

export const clientService = new ClientService(new TypeOrmClientRepository());
