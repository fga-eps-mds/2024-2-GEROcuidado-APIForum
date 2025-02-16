import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicacaoService } from '../publicacao/publicacao.service';
import { Ordering } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { DenunciaService } from './denuncia.service';
import { CreateDenunciaDto } from './dto/create-denuncia.dto';
import { UpdateDenunciaDto } from './dto/update-denuncia.dto';
import { Denuncia } from './entities/denuncia.entity';

describe('DenunciaService', () => {
  let service: DenunciaService;
  let repository: Repository<Denuncia>;
  let publicacaoService: PublicacaoService;

  const mockDenuncia: Denuncia = {
    id: 1,
    idUsuario: 1,
    motivo: 'Conteúdo inadequado',
    descricao: 'Descrição da denúncia',
    dataHora: new Date().toISOString(), // Garantir que dataHora seja uma string
  };

  const mockResponsePaginate: ResponsePaginate<Denuncia[]> = {
    data: [mockDenuncia],
    count: 1,
    pageSize: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DenunciaService,
        {
          provide: getRepositoryToken(Denuncia),
          useValue: {
            create: jest.fn().mockImplementation((dto) => ({
              ...dto,
              id: 1, // Simula a criação de uma denúncia com ID
              dataHora: dto.dataHora, // Mantém como string
            })),
            save: jest.fn().mockImplementation((entity) => {
              // Garante que dataHora seja uma string
              if (entity.dataHora && typeof entity.dataHora !== 'string') {
                entity.dataHora = entity.dataHora.toISOString();
              }
              return Promise.resolve(entity);
            }),
            find: jest.fn().mockResolvedValue([mockDenuncia]),
            findOne: jest.fn().mockResolvedValue(mockDenuncia),
            findOneOrFail: jest.fn().mockResolvedValue(mockDenuncia),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              offset: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockDenuncia], 1]),
            })),
            merge: jest.fn().mockImplementation((entity, dto) => {
              const updatedEntity = { ...entity, ...dto };
              // Garante que dataHora seja uma string
              if (dto.dataHora && typeof dto.dataHora !== 'string') {
                updatedEntity.dataHora = dto.dataHora.toISOString();
              }
              return updatedEntity;
            }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PublicacaoService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 1 }), // Simula uma publicação existente
          },
        },
      ],
    }).compile();

    service = module.get<DenunciaService>(DenunciaService);
    repository = module.get<Repository<Denuncia>>(getRepositoryToken(Denuncia));
    publicacaoService = module.get<PublicacaoService>(PublicacaoService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma denúncia com sucesso', async () => {
      const createDenunciaDto: CreateDenunciaDto = {
        idUsuario: 1,
        motivo: 'Conteúdo inadequado',
        descricao: 'Descrição da denúncia',
        dataHora: new Date().toISOString(), // Passa como string
        publicacaoId: 1,
      };

      const result = await service.create(createDenunciaDto);

      expect(publicacaoService.findOne).toHaveBeenCalledWith(1);
      expect(repository.create).toHaveBeenCalledWith({
        ...createDenunciaDto,
        dataHora: expect.any(String), // Verifica se é uma string
      });
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
        ...createDenunciaDto,
        dataHora: expect.any(String), // Verifica se é uma string
      }));
      expect(result).toEqual(expect.objectContaining({
        ...createDenunciaDto,
        dataHora: expect.any(String), // Verifica se é uma string
      }));
    });

    it('deve lançar uma exceção se a publicação não for encontrada', async () => {
      const createDenunciaDto: CreateDenunciaDto = {
        idUsuario: 1,
        motivo: 'Conteúdo inadequado',
        descricao: 'Descrição da denúncia',
        dataHora: new Date().toISOString(),
        publicacaoId: 999, // ID inexistente
      };

      jest.spyOn(publicacaoService, 'findOne').mockResolvedValue(null as any);

      await expect(service.create(createDenunciaDto)).rejects.toThrowError(
        new NotFoundException('Publicação não encontrada!'),
      );
    });

    it('deve lançar uma exceção se ocorrer um erro ao salvar a denúncia', async () => {
      const createDenunciaDto: CreateDenunciaDto = {
        idUsuario: 1,
        motivo: 'Conteúdo inadequado',
        descricao: 'Descrição da denúncia',
        dataHora: new Date().toISOString(),
        publicacaoId: 1,
      };

      jest.spyOn(repository, 'save').mockRejectedValue(new Error('Erro ao salvar denúncia'));

      await expect(service.create(createDenunciaDto)).rejects.toThrowError(
        'Erro ao salvar denúncia',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista paginada de denúncias', async () => {
      const ordering: Ordering = new Ordering('id');
      ordering.dir = 'ASC';
      const paging: Pagination = {
        limit: 10,
        offset: 0,
        getOffset: () => 0,
        getLimit: () => 10,
      };

      const result = await service.findAll(ordering, paging);

      expect(repository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual(mockResponsePaginate);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma denúncia pelo ID', async () => {
      const result = await service.findOne(1);

      expect(repository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockDenuncia);
    });

    it('deve lançar uma exceção se a denúncia não for encontrada', async () => {
      jest
        .spyOn(repository, 'findOneOrFail')
        .mockRejectedValue(new NotFoundException('Denúncia não encontrada!'));

      await expect(service.findOne(999)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma denúncia com sucesso', async () => {
      const updateDenunciaDto: UpdateDenunciaDto = {
        motivo: 'Conteúdo ofensivo',
        dataHora: new Date().toISOString(), // Passa como string
      };
  
      // Cria uma cópia do mockDenuncia com as atualizações do DTO
      const updatedDenuncia = {
        ...mockDenuncia,
        ...updateDenunciaDto,
        dataHora: updateDenunciaDto.dataHora, // Mantém como string
      };
  
      // Mock do findOneOrFail para retornar a denúncia existente
      jest.spyOn(repository, 'findOneOrFail').mockResolvedValue(mockDenuncia);
  
      // Mock do merge para retornar a denúncia atualizada
      jest.spyOn(repository, 'merge').mockImplementation((entity, dto) => {
        const updatedEntity = { ...entity, ...dto };
        return updatedEntity;
      });
  
      // Mock do save para retornar a denúncia atualizada
      jest.spyOn(repository, 'save').mockResolvedValue(updatedDenuncia);
  
      const result = await service.update(1, updateDenunciaDto);
  
      // Verifica se o método findOneOrFail foi chamado corretamente
      expect(repository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 1 } });
  
      // Verifica se o merge foi chamado com a denúncia original e o DTO
      expect(repository.merge).toHaveBeenCalledWith(
        mockDenuncia,
        expect.objectContaining({
          ...updateDenunciaDto,
          dataHora: expect.any(String), // Verifica se é uma string
        })
      );
  
      // Verifica se o save foi chamado com a denúncia atualizada
      expect(repository.save).toHaveBeenCalledWith(updatedDenuncia);
  
      // Verifica se o resultado é a denúncia atualizada
      expect(result).toEqual(updatedDenuncia);
    });
  
    it('deve lançar uma exceção se a denúncia não for encontrada', async () => {
      jest
        .spyOn(repository, 'findOneOrFail')
        .mockRejectedValue(new NotFoundException('Denúncia não encontrada!'));
  
      await expect(service.update(999, { motivo: 'Conteúdo ofensivo', dataHora: new Date().toISOString() })).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover uma denúncia com sucesso', async () => {
      await service.remove(1);

      expect(repository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.remove).toHaveBeenCalledWith(mockDenuncia);
    });

    it('deve lançar uma exceção se a denúncia não for encontrada', async () => {
      jest
        .spyOn(repository, 'findOneOrFail')
        .mockRejectedValue(new NotFoundException('Denúncia não encontrada!'));

      await expect(service.remove(999)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });
});