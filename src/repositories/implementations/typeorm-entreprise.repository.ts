import { AppDataSource } from '../../config/database';
import { UpdateEntrepriseDto } from '../../dtos/entreprise.dto';
import { Entreprise } from '../../entities/Entreprise';
import { IEntrepriseRepository, PublicEntrepriseItem } from '../interfaces';

export class TypeOrmEntrepriseRepository implements IEntrepriseRepository {
  private readonly repo = AppDataSource.getRepository(Entreprise);

  getPublicList(): Promise<PublicEntrepriseItem[]> {
    return this.repo.find({
      select: ['id', 'nom', 'logo'],
      order: { nom: 'ASC' },
    });
  }

  findById(id: string): Promise<Entreprise | null> {
    return this.repo.findOneBy({ id });
  }

  async update(id: string, payload: UpdateEntrepriseDto): Promise<Entreprise | null> {
    await this.repo.update(id, payload);
    return this.findById(id);
  }
}
