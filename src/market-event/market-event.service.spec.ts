import { Test, TestingModule } from '@nestjs/testing';
import { MarketEventService } from './market-event.service';

describe('MarketEventService', () => {
  let service: MarketEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketEventService],
    }).compile();

    service = module.get<MarketEventService>(MarketEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
