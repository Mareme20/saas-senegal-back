import { UpdateLogoDto, UpdateProduitImageDto } from '../../dtos/upload.dto';

export interface IUploadRepository {
  updateEntrepriseLogo(payload: UpdateLogoDto): Promise<void>;
  updateProduitImage(payload: UpdateProduitImageDto): Promise<boolean>;
}
