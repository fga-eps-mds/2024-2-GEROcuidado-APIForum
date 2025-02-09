import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ECategoriaPublicacao } from '../classes/categoria-publicacao.enum';

export class CreatePublicacaoDto {
  @IsNumber()
  @IsNotEmpty()
  idUsuario!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo!: string;

  @IsString()
  @MaxLength(1500)
  @IsNotEmpty()
  descricao!: string;

  @IsDateString()
  @IsNotEmpty()
  dataHora!: Date;

  @IsNotEmpty()
  @IsEnum(ECategoriaPublicacao)
  categoria!: ECategoriaPublicacao;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  idUsuarioReporte?: number[];
}
