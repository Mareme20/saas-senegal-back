import { Entreprise } from '../../entities/Entreprise';
import { UpdateEntrepriseDto } from '../../dtos/entreprise.dto';

export interface PublicEntrepriseItem {
  id: string;
  nom: string;
  logo?: string;
}

export interface IEntrepriseRepository {
  getPublicList(): Promise<PublicEntrepriseItem[]>;
  findById(id: string): Promise<Entreprise | null>;
  update(id: string, payload: UpdateEntrepriseDto): Promise<Entreprise | null>;
}
