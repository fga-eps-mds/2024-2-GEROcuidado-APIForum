import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Filtering } from '../shared/decorators/filtrate.decorator';
import { OrderParams, Ordering } from '../shared/decorators/ordenate.decorator';
import {
    Pagination,
    PaginationParams,
} from '../shared/decorators/paginate.decorator';
import { ECategoriaPublicacao } from './classes/categoria-publicacao.enum';
import { Publicacao } from './entities/publicacao.entity';
import { IPublicacaoFilter } from './interface/publicacao-filter.interface';
import { PublicacaoController } from './publicacao.controller';
import { PublicacaoService } from './publicacao.service';

describe('PublicacaoController', () => {
  let controller: PublicacaoController;
  let service: PublicacaoService;

  const publiDto = {
    titulo: 'titulo',
    descricao: 'descricao',
    idUsuario: 1,
    categoria: ECategoriaPublicacao.ALIMENTACAO,
    dataHora: new Date(),
  };

  const publi = {
    ...publiDto,
    id: 1,
    idUsuarioReporte: [],
    comentarios: [],
  };

  const publiUsuario = {
    ...publi,
    usuario: {
      id: 1,
      nome: 'Henrique',
      email: 'hacmelo@gmail.com',
      senha: '123',
      foto: Buffer.from('1'),
      admin: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [PublicacaoController],
      providers: [
        {
          provide: PublicacaoService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            update: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Publicacao),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PublicacaoController>(PublicacaoController);
    service = module.get<PublicacaoService>(PublicacaoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma publicação com sucesso', async () => {
      const createPublicacaoDto: CreatePublicacaoDto = {
        titulo: 'Título de Teste',
        descricao: 'Descrição de Teste',
        idUsuario: 1,
        dataHora: new Date(),
        categoria: ECategoriaPublicacao.TESTE,
      };

      const result = await controller.create(createPublicacaoDto);

      expect(service.create).toHaveBeenCalledWith(createPublicacaoDto);
      expect(result).toEqual(new HttpResponse(mockPublicacao).onCreated());
    });

    it('deve lançar uma BadRequestException em caso de erro no serviço', async () => {
      const createPublicacaoDto: CreatePublicacaoDto = {
        titulo: 'Título de Teste',
        descricao: 'Descrição de Teste',
        idUsuario: 1,
        dataHora: new Date(),
        categoria: ECategoriaPublicacao.TESTE,
      };

      jest.spyOn(service, 'create').mockRejectedValue(new BadRequestException('Erro ao criar publicação'));

      await expect(controller.create(createPublicacaoDto)).rejects.toThrowError(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista paginada de publicações', async () => {
      const result = await controller.findAll({ filter: {} } as any, { limit: 10, offset: 0 } as any, { column: 'id', dir: 'ASC' } as any);

      expect(service.findAll).toHaveBeenCalledWith({}, { column: 'id', dir: 'ASC' }, { limit: 10, offset: 0 });
      expect(result).toEqual(mockResponsePaginate);
    });

    it('deve lançar uma exceção em caso de erro no serviço', async () => {
      jest.spyOn(service, 'findAll').mockRejectedValue(new Error('Erro ao buscar publicações'));

      await expect(controller.findAll({ filter: {} } as any, { limit: 10, offset: 0 } as any, { column: 'id', dir: 'ASC' } as any)).rejects.toThrowError(Error);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma publicação pelo ID', async () => {
      const param: IdValidator = { id: 1 };
      const result = await controller.findOne(param);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockPublicacao);
    });

    it('deve lançar uma exceção em caso de erro no serviço', async () => {
      const param: IdValidator = { id: 1 };
      jest.spyOn(service, 'findOne').mockRejectedValue(new Error('Erro ao buscar publicação'));

      await expect(controller.findOne(param)).rejects.toThrowError(Error);
    });

    it('deve lançar NotFoundException se a publicação não for encontrada', async () => {
      const param: IdValidator = { id: 999 };
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('Publicação não encontrada'));

      await expect(controller.findOne(param)).rejects.toThrowError(NotFoundException);
    });
  });

  describe('findAll', () => {
    const filter: IPublicacaoFilter = {
      id: 1,
      categoria: ECategoriaPublicacao.ALIMENTACAO,
      titulo: 'titulo',
    };
    const filtering = new Filtering<IPublicacaoFilter>(JSON.stringify(filter));

    const order: OrderParams = {
      column: 'id',
      dir: 'ASC',
    };
    const ordering: Ordering = new Ordering(JSON.stringify(order));

    const paginate: PaginationParams = {
      limit: 10,
      offset: 0,
    };
    const pagination: Pagination = new Pagination(paginate);

    it('should findAll Publicacao', async () => {
      const expected = { data: [publiUsuario], count: 1, pageSize: 1 };

      jest.spyOn(service, 'findAll').mockReturnValue(Promise.resolve(expected));

      const { data, count, pageSize } = await controller.findAll(
        filtering,
        pagination,
        ordering,
      );

      expect(count).toEqual(1);
      expect(pageSize).toEqual(1);
      expect(data).toEqual([publiUsuario]);
    });
  });
});
