import { Test, TestingModule } from '@nestjs/testing';
import { MarketEventAdminController } from './market-event.admin.controller';

describe('MarketEventAdminController', () => {
  let controller: MarketEventAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketEventAdminController],
    }).compile();

    controller = module.get<MarketEventAdminController>(
      MarketEventAdminController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
