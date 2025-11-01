import { Test, TestingModule } from '@nestjs/testing';
import { LiveMarketService } from './live-market.service';

describe('LiveMarketService', () => {
  let service: LiveMarketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveMarketService],
    }).compile();

    service = module.get<LiveMarketService>(LiveMarketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
