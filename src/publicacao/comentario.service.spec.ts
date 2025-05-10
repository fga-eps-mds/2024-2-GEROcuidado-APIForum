import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { Publicacao } from '../publicacao/entities/publicacao.entity';
import { Ordering } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import { ComentariosService } from './comentario.service';
import { Comentario } from './entities/comentario.entity';

describe('ComentariosService', () => {
  let service: ComentariosService;
  let comentarioRepository: Repository<Comentario>;
  let clientProxy: ClientProxy;

  const mockComentario = {
    id: expect.any(Number),
    conteudo: 'Comentário de teste',
    idUsuario: 1,
    publicacaoId: 1,
    dataHora: expect.any(String),
  };

  const mockUsuario = {
    id: 1,
    nome: 'Usuário Teste',
  };

  const mockComentarioWithUsuario = {
    ...mockComentario,
    usuario: mockUsuario,
  };

  const mockPublicacao = {
    id: 1,
    titulo: 'Publicação de teste',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComentariosService,
        {
          provide: getRepositoryToken(Comentario),
          useValue: {
            create: jest.fn().mockReturnValue(mockComentario),
            save: jest.fn().mockResolvedValue(mockComentarioWithUsuario), // Retorna com usuário
            findOneOrFail: jest.fn().mockResolvedValue(mockComentarioWithUsuario), // Retorna com usuário
            merge: jest.fn().mockReturnValue(mockComentarioWithUsuario), // Retorna com usuário
            remove: jest.fn().mockResolvedValue(mockComentarioWithUsuario), // Retorna com usuário
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockComentario], 1]),
            })),
            manager: {
              findOne: jest.fn().mockImplementation((entity, options) => {
                if (options.where.id === 1) {
                  return Promise.resolve(mockPublicacao);
                }
                return Promise.resolve(null); // Simula publicação não encontrada
              }),
            },
          },
        },
        {
          provide: 'USUARIO_CLIENT',
          useValue: {
            send: jest.fn().mockImplementation((pattern, payload) => {
              if (payload.id === 1) {
                return of(mockUsuario); // Simula sucesso ao buscar usuário
              }
              return throwError(() => new Error('Usuário não encontrado')); // Simula erro ao buscar usuário
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ComentariosService>(ComentariosService);
    comentarioRepository = module.get<Repository<Comentario>>(getRepositoryToken(Comentario));
    clientProxy = module.get<ClientProxy>('USUARIO_CLIENT');
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um comentário com sucesso', async () => {
      const createComentarioDto = {
        conteudo: 'Comentário de teste',
        idUsuario: 1,
        publicacaoId: 1,
        dataHora: expect.any(String),
      };

      const result = await service.create(createComentarioDto);

      expect(comentarioRepository.manager.findOne).toHaveBeenCalledWith(Publicacao, { where: { id: 1 } });
      expect(comentarioRepository.create).toHaveBeenCalledWith({
        ...createComentarioDto,
        publicacao: mockPublicacao,
      });
      expect(comentarioRepository.save).toHaveBeenCalledWith(expect.objectContaining(createComentarioDto));
      expect(result).toEqual(expect.objectContaining(createComentarioDto));
    });

    it('deve lançar NotFoundException se a publicação não for encontrada', async () => {
      const createComentarioDto = {
        conteudo: 'Comentário de teste',
        idUsuario: 1,
        publicacaoId: 999, // ID inexistente
        dataHora: expect.any(String),
      };

      jest.spyOn(comentarioRepository.manager, 'findOne').mockResolvedValue(null);

      await expect(service.create(createComentarioDto)).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se ocorrer um erro desconhecido', async () => {
      const createComentarioDto = {
        conteudo: 'Comentário de teste',
        idUsuario: 1,
        publicacaoId: 1,
        dataHora: expect.any(String),
      };

      jest.spyOn(comentarioRepository, 'save').mockRejectedValue(new Error('Erro desconhecido'));

      await expect(service.create(createComentarioDto)).rejects.toThrowError(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista paginada de comentários com usuários', async () => {
      const ordering: Ordering = new Ordering('id');
      ordering.dir = 'ASC';
      const paging: Pagination = {
        limit: 10,
        offset: 0,
        getOffset: () => 0,
        getLimit: () => 10,
      };

      const result = await service.findAll(ordering, paging);

      expect(comentarioRepository.createQueryBuilder).toHaveBeenCalledWith('comentario');
      expect(clientProxy.send).toHaveBeenCalledWith({ role: 'info', cmd: 'get' }, { id: 1 });
      expect(result).toEqual({
        data: [mockComentarioWithUsuario],
        count: 1,
        pageSize: 10,
      });
    });

    it('deve lidar com erro na comunicação com o microserviço de usuário', async () => {
      jest.spyOn(clientProxy, 'send').mockReturnValue(throwError(() => new Error('Timeout')));

      const ordering: Ordering = new Ordering('id');
      const paging: Pagination = { limit: 10, offset: 0 } as any;

      const result = await service.findAll(ordering, paging);
      expect(result.data[0]).not.toHaveProperty('usuario'); // Verifica se o campo usuario não está presente
    });
  });

  describe('findOne', () => {
    it('deve retornar um comentário com informações do usuário', async () => {
      const result = await service.findOne(1);

      expect(comentarioRepository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(clientProxy.send).toHaveBeenCalledWith({ role: 'info', cmd: 'get' }, { id: 1 });
      expect(result).toEqual(mockComentarioWithUsuario);
    });

    it('deve lançar NotFoundException se o comentário não for encontrado', async () => {
      jest.spyOn(comentarioRepository, 'findOneOrFail').mockRejectedValue(new NotFoundException('Comentário não encontrado!'));

      await expect(service.findOne(999)).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('deve lançar NotFoundException se o comentário for undefined', async () => {
      jest.spyOn(comentarioRepository, 'findOneOrFail').mockResolvedValue(undefined as never);

      await expect(service.findOne(999)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar um comentário com sucesso', async () => {
      const updateComentarioDto = { conteudo: 'Comentário atualizado' };

      const result = await service.update(1, updateComentarioDto);

      expect(comentarioRepository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(comentarioRepository.merge).toHaveBeenCalledWith(
        mockComentarioWithUsuario, // Objeto esperado com usuário
        updateComentarioDto
      );
      expect(comentarioRepository.save).toHaveBeenCalledWith(mockComentarioWithUsuario);
      expect(result).toEqual(mockComentarioWithUsuario);
    });

    it('deve lançar NotFoundException se o comentário não for encontrado para atualização', async () => {
      const updateComentarioDto = { conteudo: 'Comentário atualizado' };

      jest.spyOn(comentarioRepository, 'findOneOrFail').mockRejectedValue(new NotFoundException('Comentário não encontrado!'));

      await expect(service.update(999, updateComentarioDto)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover um comentário com sucesso', async () => {
      await service.remove(1);

      expect(comentarioRepository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(comentarioRepository.remove).toHaveBeenCalledWith(mockComentarioWithUsuario);
    });

    it('deve lançar NotFoundException se o comentário não for encontrado para remoção', async () => {
      jest.spyOn(comentarioRepository, 'findOneOrFail').mockRejectedValue(new NotFoundException('Comentário não encontrado!'));

      await expect(service.remove(999)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });
});