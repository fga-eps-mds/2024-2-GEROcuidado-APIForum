import { PartialType } from '@nestjs/mapped-types';
import { CreateDenunciaDto } from '../dto/create-denuncia.dto';


export class UpdateDenunciaDto extends PartialType(CreateDenunciaDto) {
}
