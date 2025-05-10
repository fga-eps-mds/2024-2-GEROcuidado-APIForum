import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { HttpResponse } from '../shared/classes/http-response';
import { Filtering, Filtrate } from '../shared/decorators/filtrate.decorator';
import { Ordenate, Ordering } from '../shared/decorators/ordenate.decorator';
import { Paginate, Pagination } from '../shared/decorators/paginate.decorator';
import { PublicRoute } from '../shared/decorators/public-route.decorator';
import { Response } from '../shared/interceptors/data-transform.interceptor';
import { ResponsePaginate } from '../shared/interfaces/response-paginate.interface';
import { IdValidator } from '../shared/validators/id.validator';
import { CreatePublicacaoDto } from './dto/create-publicacao.dto';
import { UpdatePublicacaoDto } from './dto/update-publicacao.dto';
import { Publicacao } from './entities/publicacao.entity';
import { IPublicacaoFilter } from './interface/publicacao-filter.interface';
import { IPublicacaoUsuario } from './interface/publicacao-usuario.interface';
import { PublicacaoService } from './publicacao.service';

@Controller('api/forum')
export class PublicacaoController {
  constructor(private readonly _service: PublicacaoService) {}

  @Get()
  @PublicRoute()
  async findAll(
    @Filtrate() queryParam: Filtering<IPublicacaoFilter>,
    @Paginate() pagination: Pagination,
    @Ordenate() ordering: Ordering,
  ): Promise<ResponsePaginate<IPublicacaoUsuario[]>> {
    return this._service.findAll(queryParam.filter, ordering, pagination);
  }

  @Get(':id')
  @PublicRoute()
  async findOne(@Param() param: IdValidator): Promise<IPublicacaoUsuario> {
    return this._service.findOne(param.id);
  }

  @Patch(':id')
  async update(
    @Param() param: IdValidator,
    @Body() body: UpdatePublicacaoDto,
  ): Promise<Response<Publicacao>> {
    const updated = await this._service.update(param.id, body);
    return new HttpResponse<Publicacao>(updated).onUpdated();
  }

  @Post()
  async create(@Body() body: CreatePublicacaoDto) {
    console.log("Dados recebidos no Controller:", body);
    const created = await this._service.create(body);
    console.log("Dados recebidos:", created);
    return new HttpResponse<Publicacao>(created).onCreated();
  }

  @Delete(':id')
  async remove(@Param() param: IdValidator): Promise<Response<unknown>> {
    const deleted = await this._service.remove(param.id);
    return new HttpResponse(deleted).onDeleted();
  }
}