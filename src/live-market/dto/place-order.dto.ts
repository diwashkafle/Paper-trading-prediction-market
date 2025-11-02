import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { OrderType } from '../entities/order.entity';

export class PlaceOrderDto {
  @IsInt()
  eventId: number;

  @IsEnum(OrderType)
  type: OrderType;

  @IsInt()
  @Min(1)
  @Max(99)
  price: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
