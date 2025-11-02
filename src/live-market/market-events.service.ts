import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type OrderBookUpdate = { eventId: number; payload: unknown };
export type TradeUpdate = { eventId: number; payload: unknown };

@Injectable()
export class MarketEventsService implements OnModuleDestroy {
  private readonly logger = new Logger(MarketEventsService.name);

  private readonly orderBookSubject = new Subject<OrderBookUpdate>();
  private readonly tradeSubject = new Subject<TradeUpdate>();

  publishOrderBookUpdate(eventId: number, payload: unknown) {
    this.logger.debug(`publishOrderBookUpdate(${eventId})`);
    this.orderBookSubject.next({ eventId, payload });
  }

  onOrderBookUpdate(): Observable<OrderBookUpdate> {
    return this.orderBookSubject.asObservable();
  }

  publishTradeUpdate(eventId: number, payload: unknown) {
    this.logger.debug(`publishTradeUpdate(${eventId})`);
    this.tradeSubject.next({ eventId, payload });
  }

  onTradeUpdate(): Observable<TradeUpdate> {
    return this.tradeSubject.asObservable();
  }

  onModuleDestroy() {
    this.orderBookSubject.complete();
    this.tradeSubject.complete();
  }
}
