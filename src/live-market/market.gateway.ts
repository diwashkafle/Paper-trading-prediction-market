import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveMarketService } from './live-market.service';
import { MarketEventsService } from './market-events.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { PlaceOrderDto } from './dto/place-order.dto';
import { JwtService } from '@nestjs/jwt';

@UsePipes(new ValidationPipe())
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for development; adjust in production
  },
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // Socket.io server instance which can be used to emit events to clients

  private readonly logger = new Logger(MarketGateway.name); // Logger instance for logging connection and disconnection events

  constructor(
    private readonly liveMarketService: LiveMarketService,
    private readonly marketEvents: MarketEventsService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    // subscribe to market events and forward to sockets
    this.marketEvents.onOrderBookUpdate().subscribe(({ eventId, payload }) => {
      this.broadcastOrderBookUpdate(eventId, payload);
    });

    this.marketEvents.onTradeUpdate().subscribe(({ eventId, payload }) => {
      this.broadcastTradeUpdate(eventId, payload);
    });
  }

  //   Handles new client connections and authenticates them using JWT
  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.query.token;
      if (!token) {
        throw new WsException('No token provided');
      }
      const verified = this.jwtService.verify(token.toString(), {
        secret: process.env.JWT_SECRET,
      }) as unknown;

      const isValidPayload =
        typeof verified === 'object' && verified !== null && 'sub' in verified;

      if (!isValidPayload) {
        throw new WsException('Invalid token payload');
      }

      const payload = verified as { sub: number };

      const user = await this.userService.getUserById(Number(payload.sub));
      if (!user) {
        throw new WsException('User not found');
      }
      // important: attach user info to socket for future reference so we can access it later
      (socket.data as { user?: User }).user = user;
      this.logger.log(
        `Client connected: ${socket.id} (User ID: ${user.username})`,
      );
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      socket.disconnect(true);
    }
  }

  // handles client disconnections
  handleDisconnect(socket: Socket) {
    const user = (socket.data as { user?: User }).user;
    this.logger.log(
      `Client disconnected: ${socket.id} (User ID: ${user?.username || 'N/A'})`,
    );
  }

  // client join an event's room, this is how we send updates only to users looking at that event
  @SubscribeMessage('joinEvent')
  async handleSubscribe(
    @MessageBody() eventId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    const roomName = `event - ${eventId}`;
    await socket.join(roomName);

    this.logger.log(`Socket ${socket.id} joined room ${roomName}`);

    return { eventId, status: 'subscribed', room: roomName };
  }

  // client place a new order, this is the main action

  @SubscribeMessage('placeOrder')
  async handlePlaceOrder(
    @MessageBody() placeOrderDto: PlaceOrderDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const user = (socket.data as { user?: User }).user;
    if (!user) {
      throw new WsException('Unauthorized');
    }
    try {
      await this.liveMarketService.placeOrder(user, placeOrderDto);
      return { status: 'order placed' };
    } catch (error) {
      throw new WsException(error as string);
    }
  }

  // Boardcasting functions
  // this will be called by the marketService after it performs it's logic to broadcast updates to clients

  //boradcast new order to all clients in the event room
  broadcastOrderBookUpdate(eventId: number, orderBook: any) {
    const roomName = `event - ${eventId}`;
    this.server.to(roomName).emit('orderBookUpdate', orderBook);
    this.logger.log(`Broadcasted order book update to room ${roomName}`);
  }

  // broadcast new trade to all clients in the event room
  broadcastTradeUpdate(eventId: number, trade: any) {
    const roomName = `event - ${eventId}`;
    this.server.to(roomName).emit('tradeUpdate', trade);
    this.logger.log(`Broadcasted trade update to room ${roomName}`);
  }

  // sends a private message to a single user
  sendPrivateMessage(socketId: string, message: string, data: any) {
    this.server.to(socketId).emit(message, data);
  }
}
