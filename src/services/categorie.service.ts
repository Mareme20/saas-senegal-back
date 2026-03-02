import { CreateCategorieDto, UpdateCategorieDto } from '../dtos/categorie.dto';
import { TypeOrmCategorieRepository } from '../repositories/implementations';
import { ICategorieRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';

export class CategorieService {
  constructor(private readonly categorieRepository: ICategorieRepository) {}

  findAll(entrepriseId: string) {
    return this.categorieRepository.findAll(entrepriseId);
  }

  create(entrepriseId: string, payload: CreateCategorieDto) {
    return this.categorieRepository.create(entrepriseId, payload);
  }

  async update(id: string, entrepriseId: string, payload: UpdateCategorieDto) {
    const categorie = await this.categorieRepository.update(id, entrepriseId, payload);
    if (!categorie) throw ApiError.notFound('Catégorie introuvable');
    return categorie;
  }

  delete(id: string, entrepriseId: string) {
    return this.categorieRepository.delete(id, entrepriseId);
  }
}

export const categorieService = new CategorieService(new TypeOrmCategorieRepository());
