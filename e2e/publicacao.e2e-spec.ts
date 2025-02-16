import { Controller, INestApplication, ValidationPipe } from '@nestjs/common';
import {
  ClientProxy,
  ClientsModule,
  MessagePattern,
  Transport,
} from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ECategoriaPublicacao } from '../src/publicacao/classes/categoria-publicacao.enum';
import { Publicacao } from '../src/publicacao/entities/publicacao.entity';
import { AllExceptionsFilter } from '../src/shared/filters/all-exceptions.filter';
import { ModelNotFoundExceptionFilter } from '../src/shared/filters/model-not-found.exception-filter';
import { DataTransformInterceptor } from '../src/shared/interceptors/data-transform.interceptor';

@Controller()
class AutenticacaoController {
  @MessagePattern({ role: 'auth', cmd: 'check' })
  async validateToken(data: { jwt: string }) {
    return true;
  }

  @MessagePattern({ role: 'info', cmd: 'get' })
  async findOneTCP(data: { id: number }) {
    return { id: 1 };
  }

  @MessagePattern({ role: 'info', cmd: 'getAll' })
  async findAllTCP(data: { ids: number[] }) {
    return [{ id: 1 }];
  }
}

describe('E2E - Publicacao', () => {
  let app: INestApplication;
  let client: ClientProxy;
  let repository: Repository<Publicacao>;
  let token: string =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5ceyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  let publicacao: Partial<Publicacao> = {
    id: undefined,
    titulo: 'titulo',
    descricao: 'descricao',
    idUsuario: 1,
    categoria: ECategoriaPublicacao.GERAL,
    dataHora: new Date().toISOString() as any,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'USUARIO_CLIENT',
            transport: Transport.TCP,
            options: {
              host: '0.0.0.0',
              port: 8001,
            },
          },
        ]),
      ],
      controllers: [AutenticacaoController],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new DataTransformInterceptor());
    app.useGlobalFilters(
      new AllExceptionsFilter(),
      new ModelNotFoundExceptionFilter(),
    );

    app.connectMicroservice({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 8001,
      },
    });

    await app.startAllMicroservices();
    await app.init();

    client = app.get('USUARIO_CLIENT');
    await client.connect();

    repository = app.get<Repository<Publicacao>>(
      getRepositoryToken(Publicacao),
    );
  }, 60000); // Aumente o timeout para 30 segundos

  afterAll(async () => {
    if (repository) {
      await repository.delete({}); // Limpa a tabela de publicações
    }
    if (app) {
      await app.close();
    }
    if (client) {
      await client.close();
    }
  });

  describe('POST - /api/forum', () => {
    it('should successfully add a new "publicacao"', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/forum')
        .set('Content-Type', 'application/json')
        .send(publicacao);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Salvo com sucesso!');
      expect(res.body.data).toMatchObject({
        ...publicacao,
        id: res.body.data.id,
      });

      Object.assign(publicacao, res.body.data);
    });

    it('should not add a new "publicacao" when validations are incorrect', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/forum')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBeInstanceOf(Array);
      expect(res.body.message).toEqual([
        'idUsuario should not be empty',
        'idUsuario must be a number conforming to the specified constraints',
        'titulo must be shorter than or equal to 100 characters',
        'titulo should not be empty',
        'titulo must be a string',
        'descricao should not be empty',
        'descricao must be shorter than or equal to 1500 characters',
        'descricao must be a string',
        'dataHora should not be empty',
        'dataHora must be a valid ISO 8601 date string',
        'categoria must be a valid enum value',
        'categoria should not be empty',
      ]);
      expect(res.body.data).toBeNull();
    });
  });

  describe('GET - /api/forum/:id', () => {
    it('should successfully get "publicacao" by id', async () => {
      // Cria uma publicação antes de buscar
      const novaPublicacao = await repository.save({
        titulo: 'Título de teste',
        descricao: 'Descrição de teste',
        idUsuario: 1,
        categoria: ECategoriaPublicacao.GERAL,
        dataHora: new Date().toISOString(),
      });

      // Usa o ID da publicação criada
      const res = await request(app.getHttpServer())
        .get(`/api/forum/${novaPublicacao.id}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer ' + token)
        .send();

      console.log('Resposta da API:', res.body); // Log para depuração

      // Verifica a resposta
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBeNull();

      // Verifica se a resposta é um único objeto
      const data = res.body.data;
      expect(data).toMatchObject({
        id: novaPublicacao.id,
        titulo: 'Título de teste',
        descricao: 'Descrição de teste',
        idUsuario: 1,
        categoria: ECategoriaPublicacao.GERAL,
      });
    });

    it('should return status 400 when id is invalid', async () => {
      const wrongId = 'NaN';
      const res = await request(app.getHttpServer())
        .get(`/api/forum/${wrongId}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer ' + token)
        .send();

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBeInstanceOf(Array);
      expect(res.body.message).toEqual(['ID inválido']);
      expect(res.body.data).toBeNull();
    });

    it('should return status 404 when no "publicacao" is found', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/forum/9999') // ID que não existe
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer ' + token)
        .send();

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Registro(s) não encontrado(s)!');
      expect(res.body.data).toBeNull();
    });
  });

  describe('GET - /api/forum/', () => {
    it('should successfully findAll "publicacao" empty', async () => {
      const filter = JSON.stringify({
        isReported: true,
      });

      // Correção: Adicione o caminho "/api/forum" antes dos query params
      const res = await request(app.getHttpServer())
        .get(`/api/forum?filter=${filter}`) // URL corrigida
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer ' + token)
        .send();

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBeNull();
      expect(res.body.data.length).toEqual(0); // Espera uma lista vazia
    });

    it('should successfully findAll "publicacao"', async () => {
      const filter = JSON.stringify({
        categoria: publicacao.categoria,
        titulo: publicacao.titulo,
        id: publicacao.id,
      });

      // Correção: Adicione o caminho "/api/forum" antes dos query params
      const res = await request(app.getHttpServer())
        .get(`/api/forum?filter=${filter}`) // URL corrigida
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer ' + token)
        .send();

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBeNull();
      expect(res.body.data.length).toEqual(1); // Espera uma lista com 1 item
    });
  });

  describe('PATCH - /api/forum/:id', () => {
    let novaPublicacao: Publicacao;

    beforeAll(async () => {
      // Cria uma publicação antes de atualizar
      novaPublicacao = await repository.save({
        titulo: 'Título original',
        descricao: 'Descrição original',
        idUsuario: 1,
        categoria: ECategoriaPublicacao.GERAL,
        dataHora: new Date().toISOString(),
      });
    });

    it('should successfully update "publicacao" by id', async () => {
      const update = { titulo: 'novo titulo' };

      const res = await request(app.getHttpServer())
        .patch(`/api/forum/${novaPublicacao.id}`) // Usa o ID da publicação criada
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer ' + token)
        .send(update);

      console.log('Resposta da API:', res.body); // Log para depuração

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Atualizado com sucesso!');
      expect(res.body.data).toMatchObject({
        id: novaPublicacao.id,
        titulo: 'novo titulo',
        descricao: 'Descrição original',
        idUsuario: 1,
        categoria: ECategoriaPublicacao.GERAL,
      });
    });
  });

  describe('DELETE - /api/forum/:id', () => {
    let novaPublicacao: Publicacao;

    beforeAll(async () => {
      // Cria uma publicação antes de excluir
      novaPublicacao = await repository.save({
        titulo: 'Título para exclusão',
        descricao: 'Descrição para exclusão',
        idUsuario: 1,
        categoria: ECategoriaPublicacao.GERAL,
        dataHora: new Date().toISOString(),
      });
    });

    it('should successfully delete "publicacao" by id', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/forum/${novaPublicacao.id}`) // Usa o ID da publicação criada
        .set('Content-Type', 'application/json')
        .set('Authorization', 'bearer ' + token)
        .send();

      console.log('Resposta da API:', res.body); // Log para depuração

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Excluído com sucesso!');
      expect(res.body.data).toMatchObject({
        titulo: 'Título para exclusão',
        descricao: 'Descrição para exclusão',
        idUsuario: 1,
        categoria: ECategoriaPublicacao.GERAL,
      });
    });
  });

  describe('E2E - Comentario', () => {
    beforeAll(async () => {
      // Cria uma publicação antes do teste
      publicacao = await repository.save({
        titulo: 'Publicação para comentário',
        descricao: 'Descrição da publicação',
        idUsuario: 1,
        categoria: ECategoriaPublicacao.GERAL,
        dataHora: new Date().toISOString(),
      });
    });
  
    describe('POST - /api/comentarios/comentario', () => {
      it('should successfully add a new "comentario"', async () => {
        // Cria uma publicação antes de criar o comentário
        const publicacao = await repository.save({
          titulo: 'Publicação para comentário',
          descricao: 'Descrição da publicação',
          idUsuario: 1,
          categoria: ECategoriaPublicacao.GERAL,
          dataHora: new Date().toISOString(),
        });
  
        // Dados do comentário
        const comentarioData = {
          conteudo: 'Comentário de teste',
          idUsuario: 1,
          publicacaoId: publicacao.id, // Usa o ID da publicação criada
          dataHora: new Date().toISOString(),
        };
  
        // Faz a requisição POST
        const res = await request(app.getHttpServer())
          .post('/api/comentarios/comentario')
          .set('Content-Type', 'application/json')
          .send(comentarioData);
  
        console.log('Resposta da API:', res.body); // Log para depuração
  
        // Verifica a resposta
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({
          message: null, // Ajuste para o valor real retornado pela API
          data: {
            id: expect.any(Number),
            conteudo: 'Comentário de teste',
            idUsuario: 1,
            publicacao: {
              id: publicacao.id,
              titulo: publicacao.titulo,
              descricao: publicacao.descricao,
              idUsuario: publicacao.idUsuario,
              categoria: publicacao.categoria,
              dataHora: publicacao.dataHora,
              idUsuarioReporte: expect.any(Array), // Ajuste conforme a estrutura real
            },
            dataHora: expect.any(String),
          },
        });
      });
    });
  
    describe('GET - /api/comentarios/all', () => {
      it('should successfully retrieve all "comentario"', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/comentarios/all')
          .set('Content-Type', 'application/json')
          .send();
  
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBeNull();
        expect(Array.isArray(res.body.data)).toBeTruthy();
      });
    });
  
    describe('GET - /api/comentarios/:id', () => {
      it('should successfully retrieve "comentario" by id', async () => {
        // Cria uma publicação e um comentário antes de buscar
        const publicacao = await repository.save({
          titulo: 'Publicação para comentário',
          descricao: 'Descrição da publicação',
          idUsuario: 1,
          categoria: ECategoriaPublicacao.GERAL,
          dataHora: new Date().toISOString(),
        });
  
        const comentarioRes = await request(app.getHttpServer())
          .post('/api/comentarios/comentario')
          .set('Content-Type', 'application/json')
          .send({
            conteudo: 'Comentário de teste',
            idUsuario: 1,
            publicacaoId: publicacao.id,
            dataHora: new Date().toISOString(),
          });
  
        const comentario = comentarioRes.body.data;
  
        // Busca o comentário pelo ID
        const res = await request(app.getHttpServer())
          .get(`/api/comentarios/${comentario.id}`)
          .set('Content-Type', 'application/json')
          .send();
  
        console.log('Resposta da API:', res.body); // Log para depuração
  
        // Verifica a resposta
        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toMatchObject({
          id: comentario.id,
          conteudo: 'Comentário de teste',
          idUsuario: 1,
          publicacao: {
            id: publicacao.id,
            titulo: publicacao.titulo,
            descricao: publicacao.descricao,
            idUsuario: publicacao.idUsuario,
            categoria: publicacao.categoria,
            dataHora: publicacao.dataHora,
            idUsuarioReporte: expect.any(Array),
          },
          dataHora: expect.any(String),
        });
      });
    });
  
    describe('PUT - /api/comentarios/:id', () => {
      it('should successfully update "comentario" by id', async () => {
        // Cria uma publicação e um comentário antes de atualizar
        const publicacao = await repository.save({
          titulo: 'Publicação para comentário',
          descricao: 'Descrição da publicação',
          idUsuario: 1,
          categoria: ECategoriaPublicacao.GERAL,
          dataHora: new Date().toISOString(),
        });
    
        const comentarioRes = await request(app.getHttpServer())
          .post('/api/comentarios/comentario')
          .set('Content-Type', 'application/json')
          .send({
            conteudo: 'Comentário de teste',
            idUsuario: 1,
            publicacaoId: publicacao.id,
            dataHora: new Date().toISOString(),
          });
    
        const comentario = comentarioRes.body.data;
    
        // Atualiza o comentário
        const update = { conteudo: 'Comentário atualizado' };
        const res = await request(app.getHttpServer())
          .put(`/api/comentarios/${comentario.id}`)
          .set('Content-Type', 'application/json')
          .send(update);
    
        console.log('Resposta da API:', res.body); // Log para depuração
    
        // Verifica a resposta
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Atualizado com sucesso!'); // Ajuste conforme a resposta real
        expect(res.body.data).toMatchObject({
          id: comentario.id,
          conteudo: 'Comentário atualizado',
          idUsuario: 1,
          publicacao: {
            id: publicacao.id,
            titulo: publicacao.titulo,
            descricao: publicacao.descricao,
            idUsuario: publicacao.idUsuario,
            categoria: publicacao.categoria,
            dataHora: publicacao.dataHora,
            idUsuarioReporte: expect.any(Array),
          },
          dataHora: expect.any(String),
        });
      });
    });
    describe('DELETE - /api/comentarios/:id', () => {
      it('should successfully delete "comentario" by id', async () => {
        // Cria uma publicação e um comentário antes de excluir
        const publicacao = await repository.save({
          titulo: 'Publicação para comentário',
          descricao: 'Descrição da publicação',
          idUsuario: 1,
          categoria: ECategoriaPublicacao.GERAL,
          dataHora: new Date().toISOString(),
        });
    
        const comentarioRes = await request(app.getHttpServer())
          .post('/api/comentarios/comentario')
          .set('Content-Type', 'application/json')
          .send({
            conteudo: 'Comentário de teste',
            idUsuario: 1,
            publicacaoId: publicacao.id,
            dataHora: new Date().toISOString(),
          });
    
        const comentario = comentarioRes.body.data;
    
        // Exclui o comentário
        const res = await request(app.getHttpServer())
          .delete(`/api/comentarios/${comentario.id}`)
          .set('Content-Type', 'application/json')
          .send();
    
        console.log('Resposta da API:', res.body); // Log para depuração
    
        // Verifica a resposta
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Excluído com sucesso!'); // Ajuste conforme a resposta real
      });
    });
  });
});