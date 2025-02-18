import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PublicacaoService } from "../publicacao/publicacao.service";
import { Ordering } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { CreateDenunciaDto } from "./dto/create-denuncia.dto";
import { UpdateDenunciaDto } from "./dto/update-denuncia.dto";
import { Denuncia } from './entities/denuncia.entity';


@Injectable()
export class DenunciaService {
  constructor(
    @InjectRepository(Denuncia)
    private readonly _repository: Repository<Denuncia>,

    @Inject(forwardRef(() => PublicacaoService))
    private readonly _publicacaoService: PublicacaoService, // Injeção do serviço de publicação
  ) { }

  /**
   * Cria uma denúncia para uma publicação com base em um DTO.
   * @param body Dados da denúncia.
   */
  async create(body: CreateDenunciaDto): Promise<Denuncia> {

    const publicacao = await this._publicacaoService.findOne(body.publicacaoId);

    if (!publicacao) {
      throw new Error('Publicação não encontrada!');
    }

    const denuncia = this._repository.create({
      ...body,
      //publicacao,
    });

    return this._repository.save(denuncia);
  }


  /**
   * Obtém uma lista paginada de denúncias com base em critérios de ordenação e paginação.
   * @param ordering Critérios de ordenação.
   * @param paging Critérios de paginação.
   * @returns Retorna uma resposta paginada contendo a lista de denúncias.
   */
  async findAll(
    ordering: Ordering,
    paging: Pagination,
  ): Promise<ResponsePaginate<Denuncia[]>> {
    const limit = paging.limit;
    const offset = paging.offset;
    const sort = ordering.column;
    const order = ordering.dir.toUpperCase() as 'ASC' | 'DESC';

    const [result, total] = await this._repository
      .createQueryBuilder('denuncia')
      .leftJoinAndSelect('denuncia.publicacao', 'publicacao')
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


  /**
   * Busca uma denúncia específica pelo ID.
   * @param id ID da denúncia.
   */
  async findOne(id: number): Promise<Denuncia> {
    return this._repository.findOneOrFail({ where: { id } });
  }

  /**
   * Busca todas as denúncias de uma publicação.
   * @param publicacaoId ID da publicação.
   */
//   async findByPublicacaoId(publicacaoId: number): Promise<Denuncia[]> {
//     return this._repository.find({ where: { publicacaoId: publicacaoId } });
//   }

  /**
   * Atualiza os detalhes de uma denúncia.
   * @param id ID da denúncia.
   * @param body Dados da atualização.
   */
  async update(id: number, body: UpdateDenunciaDto): Promise<Denuncia> {
    const denuncia = await this._repository.findOneOrFail({ where: { id } });
    const updated = Object.assign(denuncia, body);
    return this._repository.save(updated);
  }

  /**
   * Remove uma denúncia pelo ID.
   * @param id ID da denúncia.
   */
  async remove(id: number): Promise<void> {
    const denuncia = await this._repository.findOneOrFail({ where: { id } });
    await this._repository.remove(denuncia);
  }
}