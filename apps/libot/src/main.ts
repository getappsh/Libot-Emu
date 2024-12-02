import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GET_APP_LOGGER } from '@app/common/logger/logger.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(GET_APP_LOGGER));
  app.setGlobalPrefix("api/");

  await app.listen(3010);
  
}
bootstrap();
