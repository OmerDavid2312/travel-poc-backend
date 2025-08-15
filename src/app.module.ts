import { Module } from '@nestjs/common';
import { WeatherController } from './controllers/weather.controller';
import { WeatherService } from './services/weather.service';
import { OllamaService } from './services/ollama.service';

@Module({
  imports: [],
  controllers: [WeatherController],
  providers: [
    {
      provide: OllamaService,
      useFactory: () => {
        return new OllamaService({
          ollamaModel: 'llama3.2:3b',
          ollamaUrl: 'http://localhost:11434'
        });
      },
    },
    WeatherService,
  ],
})
export class AppModule {}