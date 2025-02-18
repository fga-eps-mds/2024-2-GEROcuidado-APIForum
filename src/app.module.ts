import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutenticacaoGuard } from './autenticacao.guard';
import { ComentariosModule } from './publicacao/comentario.module';
//import { DenunciaModule } from './publicacao/denuncia.module';
import { PublicacaoModule } from './publicacao/publicacao.module';
;

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST') || 'gerocuidado-forum-db',
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_DATABASE'),
        autoLoadEntities: true,
        logging: false,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    ClientsModule.registerAsync([
      {
        name: 'USUARIO_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AUTH_HOST'),
            port: configService.get('AUTH_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    PublicacaoModule,
    //DenunciaModule,
    ComentariosModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AutenticacaoGuard,
    },
  ],
})
export class AppModule { }