import { Test, TestingModule } from '@nestjs/testing';
import { MarketEventController } from './market-event.controller';

describe('MarketEventController', () => {
  let controller: MarketEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketEventController],
    }).compile();

    controller = module.get<MarketEventController>(MarketEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
