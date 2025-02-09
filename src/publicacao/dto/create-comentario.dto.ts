import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateComentarioDto {
  @IsNotEmpty()
  @IsNumber()
  idUsuario!: number;

  @IsNotEmpty()
  @IsString()
  conteudo!: string;

  @IsNotEmpty()
  @IsDateString()
  dataHora!: string;

  @IsNotEmpty()
  @IsNumber()
  publicacaoId!: number;

}
