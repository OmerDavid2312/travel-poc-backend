import { Module } from '@nestjs/common';
import { WeatherController } from './controllers/weather.controller';
import { RecommendationController } from './controllers/recommendation.controller';
import { WeatherService } from './services/weather.service';
import { RecommendationService } from './services/recommendation.service';
import { OllamaService } from './services/ollama.service';

@Module({
  imports: [],
  controllers: [WeatherController, RecommendationController],
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
    RecommendationService,
  ],
})
export class AppModule {}