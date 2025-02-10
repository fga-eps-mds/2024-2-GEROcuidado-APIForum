import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DbService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {} // Certifique-se de que o ConfigService está sendo injetado

  createTypeOrmOptions(): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    const host = this.configService.get<string>('DB_HOST') || 'gerocuida';
    const username = this.configService.get<string>('DB_USERNAME') || 'username';
    const password = this.configService.get<string>('DB_PASS') || 'password';
    const database = this.configService.get<string>('DB_DATABASE') || 'public';
    const port = this.configService.get<number>('DB_PORT') || 5002;

    return Promise.resolve<TypeOrmModuleOptions>({
      type: 'postgres',
      host,
      port,
      username,
      password,
      database,
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
    });
  }
}