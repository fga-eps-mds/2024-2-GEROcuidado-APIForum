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

  it('should create Publicacao', async () => {
    jest.spyOn(service, 'create').mockReturnValue(Promise.resolve(publi));

    const response = await controller.create(publiDto);
    expect(response.data).toEqual(publi);
    expect(response.message).toEqual('Salvo com sucesso!');
  });

  it('should find Publicacao', async () => {
    jest
      .spyOn(service, 'findOne')
      .mockReturnValue(Promise.resolve(publiUsuario));

    const response = await controller.findOne({ id: 1 });
    expect(response).toEqual(publiUsuario);
  });

  it('should remove Publicacao', async () => {
    jest.spyOn(service, 'remove').mockReturnValue(Promise.resolve(publi));

    const response = await controller.remove({ id: 1 });
    expect(response.data).toEqual(publi);
    expect(response.message).toEqual('Excluído com sucesso!');
  });

  it('should update Publicacao', async () => {
    jest.spyOn(service, 'update').mockReturnValue(Promise.resolve(publi));

    const response = await controller.update({ id: 1 }, { titulo: 'titulo' });
    expect(response.data).toEqual(publi);
    expect(response.message).toEqual('Atualizado com sucesso!');
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
