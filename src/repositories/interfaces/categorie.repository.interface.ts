import { CreateCategorieDto, UpdateCategorieDto } from '../../dtos/categorie.dto';
import { Categorie } from '../../entities/Categorie';

export interface ICategorieRepository {
  findAll(entrepriseId: string): Promise<Categorie[]>;
  create(entrepriseId: string, payload: CreateCategorieDto): Promise<Categorie>;
  update(id: string, entrepriseId: string, payload: UpdateCategorieDto): Promise<Categorie | null>;
  delete(id: string, entrepriseId: string): Promise<void>;
}
