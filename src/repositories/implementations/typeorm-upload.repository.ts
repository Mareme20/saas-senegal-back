import { AppDataSource } from '../../config/database';
import { UpdateLogoDto, UpdateProduitImageDto } from '../../dtos/upload.dto';
import { Entreprise } from '../../entities/Entreprise';
import { Produit } from '../../entities/Produit';
import { IUploadRepository } from '../interfaces';

export class TypeOrmUploadRepository implements IUploadRepository {
  private readonly entrepriseRepo = AppDataSource.getRepository(Entreprise);
  private readonly produitRepo = AppDataSource.getRepository(Produit);

  async updateEntrepriseLogo(payload: UpdateLogoDto): Promise<void> {
    await this.entrepriseRepo.update(payload.entrepriseId, { logo: payload.url });
  }

  async updateProduitImage(payload: UpdateProduitImageDto): Promise<boolean> {
    const result = await this.produitRepo.update(
      { id: payload.produitId, entrepriseId: payload.entrepriseId },
      { image: payload.url },
    );

    return Boolean(result.affected && result.affected > 0);
  }
}
