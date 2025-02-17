import { PartialType } from '@nestjs/mapped-types';
import { CreateComentarioDto } from '../dto/create-comentario.dto';


export class UpdateComentarioDto extends PartialType(CreateComentarioDto) {
    
}