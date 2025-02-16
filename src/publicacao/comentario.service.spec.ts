import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Ordering } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import { ComentariosService } from './comentario.service';
import { Comentario } from './entities/comentario.entity';

describe('ComentariosService', () => {
  let service: ComentariosService;
  let comentarioRepository: Repository<Comentario>;

  const mockComentario = {
    id: 1,
    conteudo: 'Comentário de teste',
    idUsuario: 1,
    idPublicacao: 1,
  };

  const mockUsuario = {
    id: 1,
    nome: 'Usuário Teste',
  };

  const mockComentarioWithUsuario = {
    ...mockComentario,
    usuario: mockUsuario,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComentariosService,
        {
          provide: getRepositoryToken(Comentario),
          useValue: {
            create: jest.fn().mockReturnValue(mockComentario),
            save: jest.fn().mockImplementation((comentario) => {

              if (comentario === mockComentario) {
                return Promise.resolve(mockComentario);
              }

              return Promise.resolve(mockComentarioWithUsuario);
            }),
            findOneOrFail: jest.fn().mockResolvedValue(mockComentarioWithUsuario), // Retorna o comentário com usuário
            merge: jest.fn().mockReturnValue(mockComentarioWithUsuario), // Retorna o comentário com usuário
            remove: jest.fn().mockResolvedValue(mockComentarioWithUsuario), // Retorna o comentário com usuário
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockComentario], 1]),
            })),
          },
        },
        {
          provide: 'USUARIO_CLIENT',
          useValue: {
            send: jest.fn().mockReturnValue(of(mockUsuario)),
          },
        },
      ],
    }).compile();

    service = module.get<ComentariosService>(ComentariosService);
    comentarioRepository = module.get<Repository<Comentario>>(
      getRepositoryToken(Comentario),
    );
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um comentário com sucesso', async () => {
      const createComentarioDto = {
        conteudo: 'Comentário de teste',
        idUsuario: 1,
        idPublicacao: 1,
        dataHora: new Date().toISOString(),
        comentarioId: 1,
      };

      const result = await service.create(createComentarioDto);

      expect(comentarioRepository.create).toHaveBeenCalledWith(createComentarioDto);
      expect(comentarioRepository.save).toHaveBeenCalledWith(mockComentario);
      expect(result).toEqual(mockComentario);
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista paginada de comentários', async () => {
      const ordering: Ordering = new Ordering('id');
      ordering.dir = 'ASC';
      const paging: Pagination = {
        limit: 10,
        offset: 0,
        getOffset: () => 0,
        getLimit: () => 10,
      };


      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockComentario], 1]),
      };

      jest
        .spyOn(comentarioRepository, 'createQueryBuilder')
        .mockImplementation(() => mockQueryBuilder as unknown as SelectQueryBuilder<Comentario>);

      const result = await service.findAll(ordering, paging);


      expect(comentarioRepository.createQueryBuilder).toHaveBeenCalledWith('comentario');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('comentario.publicacao', 'publicacao');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(paging.limit);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(paging.offset);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(`"${ordering.column}"`, ordering.dir.toUpperCase());
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({
        data: [mockComentario], // Lista de comentários
        count: 1, // Total de registros
        pageSize: paging.limit, // Tamanho da página
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um comentário com informações do usuário', async () => {
      const result = await service.findOne(1);

      expect(comentarioRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockComentarioWithUsuario);
    });

    it('deve lançar uma exceção NotFoundException se o comentário não for encontrado', async () => {
      jest.spyOn(comentarioRepository, 'findOneOrFail').mockRejectedValue(new Error());

      await expect(service.findOne(999)).rejects.toThrowError();
    });
  });

  describe('update', () => {
    it('deve atualizar um comentário com sucesso', async () => {
      const updateComentarioDto = { conteudo: 'Comentário atualizado' };

      const result = await service.update(1, updateComentarioDto);

      expect(comentarioRepository.merge).toHaveBeenCalledWith(mockComentarioWithUsuario, updateComentarioDto);
      expect(comentarioRepository.save).toHaveBeenCalledWith(mockComentarioWithUsuario);
      expect(result).toEqual(mockComentarioWithUsuario);
    });
  });

  describe('remove', () => {
    it('deve remover um comentário com sucesso', async () => {
      await service.remove(1);

      expect(comentarioRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(comentarioRepository.remove).toHaveBeenCalledWith(mockComentarioWithUsuario);
    });
  });
});
