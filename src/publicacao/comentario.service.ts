import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { Repository } from 'typeorm';
import { Publicacao } from '../publicacao/entities/publicacao.entity';
import { Ordering } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { Comentario } from './entities/comentario.entity';
import {
  IUsuario,
} from './interface/publicacao-usuario.interface';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
    @Inject('USUARIO_CLIENT') private readonly clientProxy: ClientProxy,
  ) { }

  async create(createComentarioDto: CreateComentarioDto): Promise<Comentario> {
    // Carregar a Publicacao com o ID fornecido
    const publicacao = await this.comentarioRepository.manager.findOne(Publicacao, { where: { id: createComentarioDto.publicacaoId } });

    if (!publicacao) {
      throw new NotFoundException(`Publicação com ID ${createComentarioDto.publicacaoId} não encontrada`);
    }

    // Criar o comentário com a publicação associada
    const comentario = this.comentarioRepository.create({
      ...createComentarioDto,  // Preenche os dados do DTO
      publicacao,               // Associa a publicação encontrada ao comentário
    });

    return await this.comentarioRepository.save(comentario); // Salva o comentário com a associação
  }



  async findAll(
    ordering: Ordering,
    paging: Pagination,
  ): Promise<ResponsePaginate<Comentario[]>> {
    const limit = paging.limit;
    const offset = paging.offset;
    const sort = ordering.column;
    const order = ordering.dir.toUpperCase() as 'ASC' | 'DESC';

    const [result, total] = await this.comentarioRepository
      .createQueryBuilder('comentario')
      .leftJoinAndSelect('comentario.publicacao', 'publicacao')
      .leftJoinAndSelect('comentario.usuario', 'usuario') // Adicionado usuario
      .limit(limit)
      .offset(offset)
      .orderBy(`"${sort}"`, order)
      .getManyAndCount();

    return {
      data: result,
      count: +total,
      pageSize: +limit,
    };
  }

  async findOne(id: number): Promise<Comentario> {
    const comentario = await this.comentarioRepository.findOneOrFail({
      where: { id },
    });

    //const publicacao = await this.comentarioRepository.manager.findOne(Publicacao, { where: { id: comentario.publicacao.id } });

    //if (!publicacao) {
    //throw new NotFoundException(`Publicação com ID ${id} não encontrada`);
    //}

    const request = this.clientProxy
      .send({ role: 'info', cmd: 'get' }, { id: comentario.idUsuario })
      .pipe(timeout(5000));
    const usuario = await lastValueFrom(request);

    if (!comentario) {
      throw new NotFoundException(`Comentário com ID ${id} não encontrado`);
    }
    const comentarioWithUsuario = { ...comentario, usuario } as Comentario & { usuario: IUsuario };
    return comentarioWithUsuario;
  }

  async update(id: number, updateComentarioDto: UpdateComentarioDto): Promise<Comentario> {
    const comentario = await this.findOne(id);
    this.comentarioRepository.merge(comentario, updateComentarioDto);
    return await this.comentarioRepository.save(comentario);
  }

  async remove(id: number): Promise<void> {
    const comentario = await this.findOne(id);
    await this.comentarioRepository.remove(comentario);
  }
}