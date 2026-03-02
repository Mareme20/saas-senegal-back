import { UpdateEntrepriseDto } from '../dtos/entreprise.dto';
import { TypeOrmEntrepriseRepository } from '../repositories/implementations';
import { IEntrepriseRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';

export class EntrepriseService {
  constructor(private readonly entrepriseRepository: IEntrepriseRepository) {}

  getPublicList() {
    return this.entrepriseRepository.getPublicList();
  }

  async findById(id: string) {
    const entreprise = await this.entrepriseRepository.findById(id);
    if (!entreprise) throw ApiError.notFound('Entreprise introuvable');
    return entreprise;
  }

  async update(id: string, payload: UpdateEntrepriseDto) {
    const entreprise = await this.entrepriseRepository.update(id, payload);
    if (!entreprise) throw ApiError.notFound('Entreprise introuvable');
    return entreprise;
  }
}

export const entrepriseService = new EntrepriseService(new TypeOrmEntrepriseRepository());
