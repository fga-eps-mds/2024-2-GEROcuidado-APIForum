import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UpdateDenunciaDto } from '../publicacao/dto/update-denuncia.dto';
import { Ordenate, Ordering } from '../shared/decorators/ordenate.decorator';
import { Paginate, Pagination } from '../shared/decorators/paginate.decorator';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { DenunciaService } from './denuncia.service';
import { CreateDenunciaDto } from './dto/create-denuncia.dto';
import { Denuncia } from './entities/denuncia.entity';

@Controller('denuncias')
export class DenunciaController {
  constructor(private readonly denunciaService: DenunciaService) { }

  @Post()
  async create(@Body() body: CreateDenunciaDto): Promise<Denuncia> {
    try {
      return await this.denunciaService.create(body);
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
  ): Promise<ResponsePaginate<Denuncia[]>> {
    return this.denunciaService.findAll(ordering, pagination);
  }


  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Denuncia> {
    return await this.denunciaService.findOne(id);
  }

  /**
   * Atualiza uma denúncia existente.
   * @param id ID da denúncia a ser atualizada.
   * @param body Dados para atualização.
   */
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() body: UpdateDenunciaDto,
  ): Promise<Denuncia> {
    try {
      return await this.denunciaService.update(id, body);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro desconhecido ao atualizar.');
    }
  }

  /**
   * Remove uma denúncia dado o ID.
   * @param id ID da denúncia a ser removida.
   */
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    try {
      await this.denunciaService.remove(id);
      return { message: `Denúncia com ID ${id} removida com sucesso.` };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao remover.');
    }
  }
}

