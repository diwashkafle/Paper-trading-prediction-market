import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/user/entities/user.entity';
import { MarketEventService } from './market-event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ResolveEventDto } from './dto/resolve-event.dto';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MarketEventAdminController {
  constructor(private readonly eventService: MarketEventService) {}

  @Get()
  async getAllEvents() {
    return await this.eventService.getAllEventsAdmin();
  }

  @Get(':id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    return await this.eventService.getEventById(id);
  }

  @Post('create')
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return await this.eventService.createEvent(createEventDto);
  }

  @Patch('update/:id')
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return await this.eventService.updateEvent(id, updateEventDto);
  }

  @Post('resolve/:id')
  async resolveEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() resolveEventDto: ResolveEventDto,
  ) {
    return await this.eventService.resolveEvent(id, resolveEventDto);
  }

  @Post('cancel/:id')
  async cancelEvent(@Param('id', ParseIntPipe) id: number) {
    return await this.eventService.cancelEvent(id);
  }
}
