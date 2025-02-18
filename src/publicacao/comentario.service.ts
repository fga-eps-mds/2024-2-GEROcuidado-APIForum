import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { IUsuario } from './interface/publicacao-usuario.interface';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepository: Repository<Comentario>,
    @Inject('USUARIO_CLIENT') private readonly clientProxy: ClientProxy,
  ) {}

  async create(createComentarioDto: CreateComentarioDto): Promise<Comentario> {
    const publicacao = await this.comentarioRepository.manager.findOne(Publicacao, { where: { id: createComentarioDto.publicacaoId } });

    if (!publicacao) {
      throw new NotFoundException(`Publicação com ID ${createComentarioDto.publicacaoId} não encontrada`);
    }

    const comentario = this.comentarioRepository.create({
      ...createComentarioDto,
      publicacao,
    });

    try {
      return await this.comentarioRepository.save(comentario);
    } catch (error) {
      throw new BadRequestException('Erro ao salvar comentário');
    }
  }

  async findAll(ordering: Ordering, paging: Pagination): Promise<ResponsePaginate<Comentario[]>> {
    const limit = paging.limit;
    const offset = paging.offset;
    const order = ordering.dir.toUpperCase() as 'ASC' | 'DESC';

    const [result, total] = await this.comentarioRepository
      .createQueryBuilder('comentario')
      .leftJoinAndSelect('comentario.publicacao', 'publicacao')
      .limit(limit)
      .offset(offset)
      .orderBy('publicacao.id', order)
      .getManyAndCount();

    const comentariosComUsuarios = await Promise.all(
      result.map(async (comentario) => {
        try {
          const request = this.clientProxy
            .send({ role: 'info', cmd: 'get' }, { id: comentario.idUsuario })
            .pipe(timeout(5000));
          const usuario = await lastValueFrom(request);
          return { ...comentario, usuario };
        } catch (error) {
          return comentario;
        }
      })
    );

    return {
      data: comentariosComUsuarios,
      count: +total,
      pageSize: +limit,
    };
  }

  async findOne(id: number): Promise<Comentario> {
    const comentario = await this.comentarioRepository.findOneOrFail({ where: { id } });

    if (!comentario) {
      throw new NotFoundException(`Comentário com ID ${id} não encontrado`);
    }

    const request = this.clientProxy
      .send({ role: 'info', cmd: 'get' }, { id: comentario.idUsuario })
      .pipe(timeout(5000));
    const usuario = await lastValueFrom(request);

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