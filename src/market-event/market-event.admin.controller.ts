import {
  Body,
  Controller,
  Get,
  Logger,
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
import { PayoutService } from 'src/payout/payout.service';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MarketEventAdminController {
  private readonly logger = new Logger(MarketEventAdminController.name);

  constructor(
    private readonly eventService: MarketEventService,
    private readonly payoutService: PayoutService,
  ) {}

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
    const resolvedEvent = await this.eventService.resolveEvent(
      id,
      resolveEventDto,
    );

    if (!resolvedEvent) {
      this.logger.error(`Event resolution failed for event ID: ${id}`);
      return;
    }

    this.payoutService.executePayouts(resolvedEvent).catch((error) => {
      this.logger.error(`Payout execution failed for event ID: ${id}`, error);
    });
  }

  @Post('cancel/:id')
  async cancelEvent(@Param('id', ParseIntPipe) id: number) {
    return await this.eventService.cancelEvent(id);
  }
}
