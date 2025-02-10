import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateComentarioDto } from '../dto/create-comentario.dto';
import { UpdateComentarioDto } from '../dto/update-comentario.dto';
import { Publicacao } from './publicacao.entity';

@Entity({ name: 'comentario' })
export class Comentario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('integer')
  idUsuario!: number

  @Column('varchar', { length: 500 })
  conteudo!: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  dataHora!: Date;

  @ManyToOne(() => Publicacao, (publicacao) => publicacao.comentarios, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  publicacao!: Publicacao;

  constructor(createComentarioDto: CreateComentarioDto | UpdateComentarioDto,
    publicacao?: Publicacao
  ) {
    Object.assign(this, createComentarioDto);
    if (publicacao) {
      this.publicacao = publicacao;
    }
  }
}