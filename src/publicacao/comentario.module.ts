import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicacaoModule } from '../publicacao/publicacao.module';
import { PublicacaoService } from '../publicacao/publicacao.service';
import { ComentariosController } from './comentario.controller';
import { ComentariosService } from './comentario.service';
import { Comentario } from './entities/comentario.entity';
import { Publicacao } from './entities/publicacao.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Comentario, Publicacao]),
        PublicacaoModule,
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
    ],
    controllers: [ComentariosController],
    providers: [ComentariosService, PublicacaoService],
    exports: [ComentariosService],
})
export class ComentariosModule { }
