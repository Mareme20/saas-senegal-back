import { AppDataSource } from '../../config/database';
import { CreateCategorieDto, UpdateCategorieDto } from '../../dtos/categorie.dto';
import { Categorie } from '../../entities/Categorie';
import { ICategorieRepository } from '../interfaces';

export class TypeOrmCategorieRepository implements ICategorieRepository {
  private readonly repo = AppDataSource.getRepository(Categorie);

  findAll(entrepriseId: string): Promise<Categorie[]> {
    return this.repo.find({
      where: { entrepriseId },
      relations: ['produits'],
      order: { nom: 'ASC' },
    });
  }

  async create(entrepriseId: string, payload: CreateCategorieDto): Promise<Categorie> {
    const categorie = this.repo.create({ ...payload, entrepriseId });
    return this.repo.save(categorie);
  }

  async update(id: string, entrepriseId: string, payload: UpdateCategorieDto): Promise<Categorie | null> {
    await this.repo.update({ id, entrepriseId }, payload);
    return this.repo.findOneBy({ id, entrepriseId });
  }

  async delete(id: string, entrepriseId: string): Promise<void> {
    await this.repo.delete({ id, entrepriseId });
  }
}
