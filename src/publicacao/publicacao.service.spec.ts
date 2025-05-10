import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Repository } from 'typeorm';
import { Ordering, OrderParams } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import { Publicacao } from './entities/publicacao.entity';
import { PublicacaoService } from './publicacao.service';

describe('PublicacaoService', () => {
  let service: PublicacaoService;
  let repository: Repository<Publicacao>;
  let clientProxy: ClientProxy;

  const mockRepository = {
    save: jest.fn(),
    findOneOrFail: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockClientProxy = {
    send: jest.fn().mockReturnValue(of([{ id: 1, nome: 'Usuário Teste' }])), // Retorna um array de usuários
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicacaoService,
        {
          provide: getRepositoryToken(Publicacao),
          useValue: mockRepository,
        },
        {
          provide: 'USUARIO_CLIENT',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<PublicacaoService>(PublicacaoService);
    repository = module.get<Repository<Publicacao>>(getRepositoryToken(Publicacao));
    clientProxy = module.get<ClientProxy>('USUARIO_CLIENT');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create Publicacao', async () => {
    const publi = { titulo: 'titulo' } as any;
    jest.spyOn(repository, 'save').mockResolvedValue({ id: 1 } as any);
    const created = await service.create(publi);
    expect(created.id).toEqual(1);
  });

  it('should find Publicacao', async () => {
    jest.spyOn(repository, 'findOneOrFail').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(clientProxy, 'send').mockReturnValue(of({ id: 1 }));

    const found = await service.findOne(1);
    expect(found.id).toEqual(1);
  });

  it('should remove Publicacao', async () => {
    jest.spyOn(repository, 'findOneOrFail').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(repository, 'remove').mockResolvedValue({ id: 1 } as any);

    const removed = await service.remove(1);
    expect(removed.id).toEqual(1);
  });

  it('should update Publicacao', async () => {
    jest.spyOn(repository, 'findOneOrFail').mockResolvedValue({ id: 1 } as any);
    jest.spyOn(repository, 'save').mockResolvedValue({ id: 1, titulo: 'titulo 2' } as any);

    const updated = await service.update(1, { titulo: 'titulo 2' });
    expect(updated).toEqual({ id: 1, titulo: 'titulo 2' });
  });

  describe('findAll', () => {
    const publicacao = {
      id: 1,
      titulo: 'título',
      descricao: 'descricao',
      idUsuario: 1, // Adicionado idUsuario para o teste
    };

    const order: OrderParams = {
      column: 'id',
      dir: 'ASC',
    };
    const ordering: Ordering = new Ordering(JSON.stringify(order));

    const paginate: { limit: number; offset: number } = {
      limit: 10,
      offset: 0,
    };
    const pagination: Pagination = new Pagination(paginate);

    it('should findAll Publicacao', async () => {

      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[publicacao], 1]), // Retorna uma publicação e total = 1
      } as any);


      jest.spyOn(clientProxy, 'send').mockReturnValue(
        of([{ id: 1, nome: 'Usuário Teste' }]), // Retorna um usuário com id = 1
      );

      const { data, count, pageSize } = await service.findAll({}, ordering, pagination);

      // Verificações
      expect(count).toEqual(1);
      expect(pageSize).toEqual(1); // pageSize deve ser igual ao total
      expect(data[0]).toEqual({
        ...publicacao,
        usuario: { id: 1, nome: 'Usuário Teste' }, // Usuário mockado
      });


      expect(clientProxy.send).toHaveBeenCalledWith(
        { role: 'info', cmd: 'getAll' },
        { ids: [publicacao.idUsuario] },
      );
    });

    it('should findAll Publicacao with isReported', async () => {
      // Mock do repositório
      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[publicacao], 1]), // Retorna uma publicação e total = 1
      } as any);


      jest.spyOn(clientProxy, 'send').mockReturnValue(
        of([{ id: 1, nome: 'Usuário Teste' }]), // Retorna um usuário com id = 1
      );

      const { data, count, pageSize } = await service.findAll(
        { isReported: true },
        ordering,
        pagination,
      );

   
      expect(count).toEqual(1);
      expect(pageSize).toEqual(1); // pageSize deve ser igual ao total
      expect(data[0]).toEqual({
        ...publicacao,
        usuario: { id: 1, nome: 'Usuário Teste' },
      });

      expect(clientProxy.send).toHaveBeenCalledWith(
        { role: 'info', cmd: 'getAll' },
        { ids: [publicacao.idUsuario] },
      );
    });

    it('should findAll Publicacao with title unaccent', async () => {

      jest.spyOn(repository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[publicacao], 1]), // Retorna uma publicação e total = 1
      } as any);


      jest.spyOn(clientProxy, 'send').mockReturnValue(
        of([{ id: 1, nome: 'Usuário Teste' }]), // Retorna um usuário com id = 1
      );

      const { data, count, pageSize } = await service.findAll(
        { titulo: "titulo" },
        ordering,
        pagination,
      );

      expect(count).toEqual(1);
      expect(pageSize).toEqual(1); 
      expect(data[0]).toEqual({
        ...publicacao,
        usuario: { id: 1, nome: 'Usuário Teste' }, // Usuário mockado
      });


      expect(clientProxy.send).toHaveBeenCalledWith(
        { role: 'info', cmd: 'getAll' },
        { ids: [publicacao.idUsuario] },
      );
    });
  });
});