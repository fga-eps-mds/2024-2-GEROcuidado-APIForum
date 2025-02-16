// Arquivo: comentario.controller.ts falta reajustes.
import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { Ordenate, Ordering } from '../shared/decorators/ordenate.decorator';
import { Paginate, Pagination } from '../shared/decorators/paginate.decorator';
import { PublicRoute } from '../shared/decorators/public-route.decorator';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { ComentariosService } from './comentario.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { Comentario } from './entities/comentario.entity';

@Controller('api/comentarios')
@PublicRoute()
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) { }

  @Post('comentario')
  async create(@Body() body: CreateComentarioDto): Promise<Comentario> {
    try {
      console.log(body);
      return await this.comentariosService.create(body);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro desconhecido.');
    }
  }

  @Get('all')
  async findAll(
    @Paginate() pagination: Pagination,
    @Ordenate() ordering: Ordering,
  ): Promise<ResponsePaginate<Comentario[]>> {
    return this.comentariosService.findAll(ordering, pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comentariosService.findOne(+id);
  }

  @Put(':id')
async update(
  @Param('id') id: string,
  @Body() updateComentarioDto: UpdateComentarioDto,
) {
  try {
    const comentario = await this.comentariosService.update(+id, updateComentarioDto);
    return {
      message: 'Atualizado com sucesso!', // Mensagem de sucesso
      data: comentario, // Dados atualizados
    };
  } catch (error) {
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
      message: 'Excluído com sucesso!', // Mensagem de sucesso
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }
    throw new BadRequestException('Ocorreu um erro ao excluir o comentário.');
  }
}
}