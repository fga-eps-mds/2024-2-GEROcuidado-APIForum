import {  IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDenunciaDto {
  @IsNotEmpty()
  @IsNumber()
  idUsuario!: number;

  @IsNotEmpty()
  @IsString()
  motivo!: string;

  @IsNotEmpty()
  @IsString()
  descricao!: string;

  @IsNotEmpty()
  @IsDateString()
  dataHora!: string;

  @IsNotEmpty()
  @IsNumber()
  publicacaoId!: number;


}

