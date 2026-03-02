import { Client } from '../../entities/Client';
import { CreateClientDto, UpdateClientDto } from '../../dtos/client.dto';

export interface ClientListParams {
  entrepriseId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface ClientListResult {
  data: Client[];
  total: number;
}

export interface IClientRepository {
  findAll(params: ClientListParams): Promise<ClientListResult>;
  findById(id: string, entrepriseId: string): Promise<Client | null>;
  create(entrepriseId: string, payload: CreateClientDto): Promise<Client>;
  update(id: string, entrepriseId: string, payload: UpdateClientDto): Promise<Client | null>;
}
