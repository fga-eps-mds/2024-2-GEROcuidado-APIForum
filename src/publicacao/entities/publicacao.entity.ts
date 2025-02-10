import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ECategoriaPublicacao } from '../classes/categoria-publicacao.enum';
import { CreatePublicacaoDto } from '../dto/create-publicacao.dto';
import { UpdatePublicacaoDto } from '../dto/update-publicacao.dto';
import { Comentario } from './comentario.entity';
//import { Denuncia } from './denuncia.entity';

@Entity({ name: 'publicacao' })
export class Publicacao {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('integer')
  idUsuario!: number;

  @Column('varchar', { length: 100 })
  titulo!: string;

  @Column('varchar', { length: 500 })
  descricao!: string;

  @Column('timestamp')
  dataHora!: Date;

  @Column('enum', {
    enum: ECategoriaPublicacao,
    default: ECategoriaPublicacao.GERAL,
  })
  categoria!: ECategoriaPublicacao;

  @Column('integer', { array: true, default: [] })
  idUsuarioReporte!: number[];

  // @OneToMany(() => Denuncia, (denuncia: Denuncia) => denuncia.publicacao)

  //@JoinColumn()
  //denuncias!: Denuncia[];

  @OneToMany(() => Comentario, (comentario: Comentario) => comentario.publicacao)
  comentarios!: Comentario[];

  constructor(createPublicacaoDto: CreatePublicacaoDto | UpdatePublicacaoDto) {
    Object.assign(this, createPublicacaoDto);
  }
}
