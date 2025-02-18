import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';
import { Publicacao } from './publicacao/entities/publicacao.entity';

describe('AppDataSource', () => {
  it('deve estar configurado corretamente', () => {

    expect(AppDataSource).toBeInstanceOf(DataSource);

    expect(AppDataSource.options.type).toBe('postgres');
    expect((AppDataSource.options as any).host).toBe('gerocuidado-forum-db');
    expect((AppDataSource.options as any).port).toBe(5002);
    expect((AppDataSource.options as any).username).toBe('postgres');
    expect((AppDataSource.options as any).password).toBe('postgres');
    expect(AppDataSource.options.database).toBe('gerocuidado-forum-db');
    expect(AppDataSource.options.synchronize).toBe(false);


    expect(AppDataSource.options.entities).toContain(Publicacao);


    expect(AppDataSource.options.migrations).toEqual(['src/migration/*.ts']);
  });

  it('deve inicializar sem erros', async () => {

    jest.spyOn(AppDataSource, 'initialize').mockResolvedValue(AppDataSource);

    await expect(AppDataSource.initialize()).resolves.toBe(AppDataSource);
    expect(AppDataSource.initialize).toHaveBeenCalled();
  });

  it('deve lançar um erro se a inicialização falhar', async () => {
    const errorMessage = 'Erro ao conectar ao banco de dados';
    jest.spyOn(AppDataSource, 'initialize').mockRejectedValue(new Error(errorMessage));

    await expect(AppDataSource.initialize()).rejects.toThrowError(errorMessage);
    expect(AppDataSource.initialize).toHaveBeenCalled();
  });
});