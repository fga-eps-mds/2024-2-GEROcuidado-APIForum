import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Ordering } from '../shared/decorators/ordenate.decorator';
import { Pagination } from '../shared/decorators/paginate.decorator';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { DenunciaController } from './denuncia.controller';
import { DenunciaService } from './denuncia.service';
import { CreateDenunciaDto } from './dto/create-denuncia.dto';
import { UpdateDenunciaDto } from './dto/update-denuncia.dto';
import { Denuncia } from './entities/denuncia.entity';

describe('DenunciaController', () => {
  let controller: DenunciaController;
  let service: DenunciaService;

  const mockDenuncia: Denuncia = {
    id: 1,
    idUsuario: 1,
    motivo: 'Conteúdo inadequado',
    descricao: 'Descrição da denúncia',
    dataHora: expect.any(String),
  };

  const mockResponsePaginate: ResponsePaginate<Denuncia[]> = {
    data: [mockDenuncia],
    count: 1,
    pageSize: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DenunciaController],
      providers: [
        {
          provide: DenunciaService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDenuncia),
            findAll: jest.fn().mockResolvedValue(mockResponsePaginate),
            findOne: jest.fn().mockResolvedValue(mockDenuncia),
            update: jest.fn().mockResolvedValue(mockDenuncia),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<DenunciaController>(DenunciaController);
    service = module.get<DenunciaService>(DenunciaService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve criar uma denúncia com sucesso', async () => {
      const createDenunciaDto: CreateDenunciaDto = {
        idUsuario: 1,
        motivo: 'Conteúdo inadequado',
        descricao: 'Descrição da denúncia',
        dataHora: new Date().toISOString(),
        publicacaoId: 1,
      };

      const result = await controller.create(createDenunciaDto);

      expect(service.create).toHaveBeenCalledWith(createDenunciaDto);
      expect(result).toEqual(mockDenuncia);
    });

    it('deve lançar BadRequestException em caso de erro', async () => {
      const createDenunciaDto: CreateDenunciaDto = {
        idUsuario: 1,
        motivo: 'Conteúdo inadequado',
        descricao: 'Descrição da denúncia',
        dataHora: new Date().toISOString(),
        publicacaoId: 1,
      };

      jest.spyOn(service, 'create').mockRejectedValue(new Error('Erro ao criar denúncia'));

      await expect(controller.create(createDenunciaDto)).rejects.toThrowError(
        BadRequestException,
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

      const result = await controller.findAll(paging, ordering);

      expect(service.findAll).toHaveBeenCalledWith(ordering, paging);
      expect(result).toEqual(mockResponsePaginate);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma denúncia pelo ID', async () => {
      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDenuncia);
    });

    it('deve lançar BadRequestException em caso de erro', async () => {
      // Mock para lançar BadRequestException diretamente
      jest.spyOn(service, 'findOne').mockRejectedValue(new BadRequestException('Denúncia não encontrada!'));

      await expect(controller.findOne(999)).rejects.toThrowError(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma denúncia com sucesso', async () => {
      const updateDenunciaDto: UpdateDenunciaDto = {
        motivo: 'Conteúdo ofensivo',
      };

      const result = await controller.update(1, updateDenunciaDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDenunciaDto);
      expect(result).toEqual(mockDenuncia);
    });

    it('deve lançar BadRequestException em caso de erro', async () => {
      const updateDenunciaDto: UpdateDenunciaDto = {
        motivo: 'Conteúdo ofensivo',
      };

      jest.spyOn(service, 'update').mockRejectedValue(new Error('Erro ao atualizar denúncia'));

      await expect(controller.update(1, updateDenunciaDto)).rejects.toThrowError(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover uma denúncia com sucesso', async () => {
      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Denúncia com ID 1 removida com sucesso.' });
    });

    it('deve lançar BadRequestException em caso de erro', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new Error('Erro ao remover denúncia'));

      await expect(controller.remove(999)).rejects.toThrowError(
        BadRequestException,
      );
    });
  });
});