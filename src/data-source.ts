import { DataSource } from 'typeorm';
import { Publicacao } from './publicacao/entities/publicacao.entity'; // Caminho correto para sua entidade

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'gerocuidado-forum-db', // Nome do serviço no Docker Compose
  port: 5002, // Porta interna do PostgreSQL
  username: 'postgres', // Usuário do banco de dados
  password: 'postgres', // Senha do banco de dados
  database: 'gerocuidado-forum-db', // Nome do banco
  entities: [Publicacao], // Lista de entidades
  migrations: ['src/migration/*.ts'], // Caminho para as migrações
  synchronize: false, // Não sincronizar automaticamente; usar migrações
});