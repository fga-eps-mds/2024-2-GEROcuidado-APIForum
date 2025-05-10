import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put
} from '@nestjs/common';
import { Ordenate, Ordering } from '../shared/decorators/ordenate.decorator';
import { Paginate, Pagination } from '../shared/decorators/paginate.decorator';
import { PublicRoute } from '../shared/decorators/public-route.decorator';
import { ComentariosService } from './comentario.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';

@Controller('api/comentarios')
@PublicRoute()
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) { }

  @Post('comentario')
  async create(@Body() body: CreateComentarioDto) {
    try {
      const comentario = await this.comentariosService.create(body);
      return {
        message: 'Comentário criado com sucesso!',
        data: comentario, // Retorna diretamente o comentário, sem aninhar
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro ao criar o comentário.');
    }
  }

  @Get('all')
  async findAll(
    @Paginate() pagination: Pagination,
    @Ordenate() ordering: Ordering,
  ) {
    try {
      const result = await this.comentariosService.findAll(ordering, pagination);
      return {
        message: 'Comentários listados com sucesso!',
        data: result.data, // Retorna diretamente os dados
        pagination: result, // Retorna diretamente a paginação
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro ao listar os comentários.');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const comentario = await this.comentariosService.findOne(+id);
      return {
        message: 'Comentário encontrado com sucesso!',
        data: comentario, // Retorna diretamente o comentário
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro ao buscar o comentário.');
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateComentarioDto: UpdateComentarioDto,
  ) {
    try {
      const comentario = await this.comentariosService.update(+id, updateComentarioDto);
      return {
        message: 'Atualizado com sucesso!',
        data: comentario, // Retorna diretamente o comentário
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro ao atualizar o comentário.');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.comentariosService.remove(+id);
      return {
        message: 'Excluído com sucesso!', // Retorna apenas a mensagem
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro ao excluir o comentário.');
    }
  }
}