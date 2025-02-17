import {
  Column,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
import { CreateDenunciaDto } from '../dto/create-denuncia.dto';
import { UpdateDenunciaDto } from '../dto/update-denuncia.dto';

@Entity({ name: 'denuncia' })
export class Denuncia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('integer')
  idUsuario!: number;

  @Column('varchar', { length: 100 })
  motivo!: string;

  @Column('varchar', { length: 500 })
  descricao!: string;

  @Column({ type: 'varchar' }) // Define explicitamente como string
  dataHora?: string; // Tipo TypeScript: string (não String)

  //@ManyToOne(() => Publicacao, (publicacao) => publicacao.denuncias, {
  //  eager: true,
  // onDelete: 'CASCADE',
  //})
  //@JoinColumn()
  //publicacao!: Publicacao;

  constructor(createDenunciaDto: CreateDenunciaDto | UpdateDenunciaDto) {
    Object.assign(this, createDenunciaDto);
  }
}
