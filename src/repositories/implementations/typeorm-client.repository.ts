import { AppDataSource } from '../../config/database';
import { CreateClientDto, UpdateClientDto } from '../../dtos/client.dto';
import { Client } from '../../entities/Client';
import { ClientListParams, ClientListResult, IClientRepository } from '../interfaces';

export class TypeOrmClientRepository implements IClientRepository {
  private readonly repo = AppDataSource.getRepository(Client);

  async findAll(params: ClientListParams): Promise<ClientListResult> {
    const skip = (params.page - 1) * params.limit;

    const qb = this.repo
      .createQueryBuilder('c')
      .where('c.entrepriseId = :entrepriseId', { entrepriseId: params.entrepriseId });

    if (params.search) {
      qb.andWhere('(c.nom ILIKE :search OR c.telephone LIKE :search)', { search: `%${params.search}%` });
    }

    const [data, total] = await qb
      .orderBy('c.nom', 'ASC')
      .skip(skip)
      .take(params.limit)
      .getManyAndCount();

    return { data, total };
  }

  findById(id: string, entrepriseId: string): Promise<Client | null> {
    return this.repo.findOne({
      where: { id, entrepriseId },
      relations: ['factures'],
      order: { factures: { createdAt: 'DESC' } },
    });
  }

  async create(entrepriseId: string, payload: CreateClientDto): Promise<Client> {
    const client = this.repo.create({ ...payload, entrepriseId });
    return this.repo.save(client);
  }

  async update(id: string, entrepriseId: string, payload: UpdateClientDto): Promise<Client | null> {
    await this.repo.update({ id, entrepriseId }, payload);
    return this.repo.findOneBy({ id, entrepriseId });
  }
}
