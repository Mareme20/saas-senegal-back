import { UpdateLogoDto, UpdateProduitImageDto } from '../dtos/upload.dto';
import { TypeOrmUploadRepository } from '../repositories/implementations';
import { IUploadRepository } from '../repositories/interfaces';
import { ApiError } from '../utils/ApiError';

export class UploadService {
  constructor(private readonly uploadRepository: IUploadRepository) {}

  updateEntrepriseLogo(payload: UpdateLogoDto) {
    return this.uploadRepository.updateEntrepriseLogo(payload);
  }

  async updateProduitImage(payload: UpdateProduitImageDto) {
    const updated = await this.uploadRepository.updateProduitImage(payload);
    if (!updated) throw ApiError.notFound('Produit introuvable');
  }
}

export const uploadService = new UploadService(new TypeOrmUploadRepository());
