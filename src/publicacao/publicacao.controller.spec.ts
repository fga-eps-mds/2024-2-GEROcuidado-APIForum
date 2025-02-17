import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpResponse } from '../shared/classes/http-response';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { IdValidator } from '../shared/validators/id.validator';
import { ECategoriaPublicacao } from './classes/categoria-publicacao.enum';
import { CreatePublicacaoDto } from './dto/create-publicacao.dto';
import { UpdatePublicacaoDto } from './dto/update-publicacao.dto';
import { IPublicacaoUsuario } from './interface/publicacao-usuario.interface';
import { PublicacaoController } from './publicacao.controller';
import { PublicacaoService } from './publicacao.service';

describe('PublicacaoController', () => {
  let controller: PublicacaoController;
  let service: PublicacaoService;

  const mockPublicacao: IPublicacaoUsuario = {
    id: 1,
    titulo: 'Título de Teste',
    descricao: 'Descrição de Teste',
    idUsuario: 1,
    dataHora: new Date(),
    idUsuarioReporte: [1],
    usuario: {
      id: 1,
      nome: 'Usuário de Teste',
      email: 'teste@teste.com',
      foto: Buffer.from('foto_url'),
      senha: 'senha_teste',
      admin: false,
    },
    categoria: ECategoriaPublicacao.TESTE, // Replace EXISTING_MEMBER with an actual member of the enum
    comentarios: [],
  };

  const mockResponsePaginate: ResponsePaginate<IPublicacaoUsuario[]> = {
    data: [mockPublicacao],
    count: 1,
    pageSize: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicacaoController],
      providers: [
        {
          provide: PublicacaoService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockPublicacao),
            findAll: jest.fn().mockResolvedValue(mockResponsePaginate),
            findOne: jest.fn().mockResolvedValue(mockPublicacao),
            update: jest.fn().mockResolvedValue(mockPublicacao),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<PublicacaoController>(PublicacaoController);
    service = module.get<PublicacaoService>(PublicacaoService);
  });

  it('deve estar definido', () => {
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
  
      // Mock para lançar BadRequestException
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

  describe('update', () => {
    it('deve atualizar uma publicação com sucesso', async () => {
      const param: IdValidator = { id: 1 };
      const updatePublicacaoDto: UpdatePublicacaoDto = {
        titulo: 'Título Atualizado',
        descricao: 'Descrição Atualizada',
      };

      const result = await controller.update(param, updatePublicacaoDto);

      expect(service.update).toHaveBeenCalledWith(1, updatePublicacaoDto);
      expect(result).toEqual(new HttpResponse(mockPublicacao).onUpdated());
    });

    it('deve lançar uma exceção em caso de erro no serviço', async () => {
      const param: IdValidator = { id: 1 };
      const updatePublicacaoDto: UpdatePublicacaoDto = {
        titulo: 'Título Atualizado',
        descricao: 'Descrição Atualizada',
      };

      jest.spyOn(service, 'update').mockRejectedValue(new Error('Erro ao atualizar publicação'));

      await expect(controller.update(param, updatePublicacaoDto)).rejects.toThrowError(Error);
    });

    it('deve lançar NotFoundException se a publicação não for encontrada para atualização', async () => {
      const param: IdValidator = { id: 999 };
      const updatePublicacaoDto: UpdatePublicacaoDto = {
        titulo: 'Título Atualizado',
        descricao: 'Descrição Atualizada',
      };

      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException('Publicação não encontrada'));

      await expect(controller.update(param, updatePublicacaoDto)).rejects.toThrowError(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover uma publicação com sucesso', async () => {
      const param: IdValidator = { id: 1 };
      const result = await controller.remove(param);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(new HttpResponse(undefined).onDeleted());
    });

    it('deve lançar uma exceção em caso de erro no serviço', async () => {
      const param: IdValidator = { id: 1 };
      jest.spyOn(service, 'remove').mockRejectedValue(new Error('Erro ao remover publicação'));

      await expect(controller.remove(param)).rejects.toThrowError(Error);
    });

    it('deve lançar NotFoundException se a publicação não for encontrada para remoção', async () => {
      const param: IdValidator = { id: 999 };
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException('Publicação não encontrada'));

      await expect(controller.remove(param)).rejects.toThrowError(NotFoundException);
    });
  });
});
