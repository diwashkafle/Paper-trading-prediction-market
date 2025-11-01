import { Test, TestingModule } from '@nestjs/testing';
import { LiveMarketController } from './live-market.controller';

describe('LiveMarketController', () => {
  let controller: LiveMarketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveMarketController],
    }).compile();

    controller = module.get<LiveMarketController>(LiveMarketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
