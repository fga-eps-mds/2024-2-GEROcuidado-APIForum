import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { Repository } from 'typeorm';
import { Ordering } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import {
  getWhereClauseEqual,
  getWhereClauseNumber,
} from '../shared/helpers/sql-query-helper';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { CreatePublicacaoDto } from './dto/create-publicacao.dto';
import { UpdatePublicacaoDto } from './dto/update-publicacao.dto';
import { Publicacao } from './entities/publicacao.entity';
import { IPublicacaoFilter } from './interface/publicacao-filter.interface';
import {
  IPublicacaoUsuario,
  IUsuario,
} from './interface/publicacao-usuario.interface';

@Injectable()
export class PublicacaoService {
  constructor(
    @InjectRepository(Publicacao)
    private readonly _repository: Repository<Publicacao>,
    @Inject('USUARIO_CLIENT')
    private readonly _client: ClientProxy,
  ) { }

  async create(body: CreatePublicacaoDto): Promise<Publicacao> {
    const publicacao = new Publicacao(body);
    return this._repository.save(publicacao);
  }

  async findOne(id: number): Promise<IPublicacaoUsuario> {
    const publicacao = await this._repository.findOneOrFail({ where: { id } });

    const request = this._client
      .send({ role: 'info', cmd: 'get' }, { id: publicacao.idUsuario })
      .pipe(timeout(5000));
    const usuario = await lastValueFrom(request);

    return { ...publicacao, usuario };
  }

  async update(id: number, body: UpdatePublicacaoDto): Promise<Publicacao> {
    const found = await this._repository.findOneOrFail({ where: { id } });
    const merged = Object.assign(found, body);
    return this._repository.save(merged);
  }

  async findAll(
    filter: IPublicacaoFilter,
    ordering: Ordering,
    paging: Pagination,
  ): Promise<ResponsePaginate<IPublicacaoUsuario[]>> {
    const limit = paging.limit;
    const offset = paging.offset;
    const sort = ordering.column;
    const order = ordering.dir.toUpperCase() as 'ASC' | 'DESC';
    const where = this.buildWhereClause(filter);

    const [result, total] = await this._repository
      .createQueryBuilder('publicacao')
      .where(`${where}`)
      .limit(limit)
      .offset(offset)
      .orderBy(`"${sort}"`, order)
      .getManyAndCount();

    const ids = result.map((item) => item.idUsuario);
    const request = this._client
      .send({ role: 'info', cmd: 'getAll' }, { ids })
      .pipe(timeout(5000));
    const usuarios: IUsuario[] = await lastValueFrom(request);

    const publicacoes = result.map((item) => {
      const found = usuarios.find((usuario) => usuario.id === item.idUsuario);
      return {
        ...item,
        usuario: found as IUsuario,
      };
    });

    return {
      data: publicacoes,
      count: +total,
      pageSize: +total,
    };
  }

  private buildWhereClause(filter: IPublicacaoFilter): string {
    let whereClause = '1 = 1 ';

    whereClause += getWhereClauseNumber(filter.id, 'id');
    if (filter.titulo) {
      whereClause += `AND unaccent(titulo) ilike unaccent('%${filter.titulo}%')`;
    }
    whereClause += getWhereClauseEqual(filter.categoria, 'categoria');
    if (filter.isReported) {
      whereClause += 'AND array_length("idUsuarioReporte", 1) > 0';
    }

    return whereClause;
  }

  async remove(id: number) {
    const found = await this._repository.findOneOrFail({ where: { id } });
    return this._repository.remove(found);
  }
}
