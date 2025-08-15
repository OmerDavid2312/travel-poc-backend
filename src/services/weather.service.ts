import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';

export interface WeatherData {
  icon: string;
  temperature: number;
  condition: string;
  forecast: string;
  summary: string;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  
  constructor(private readonly ollamaService: OllamaService) {}

  async getWeatherData(city: string, startDate: string, endDate: string, trip: string): Promise<WeatherData> {
    try {
      this.logger.log(`Generating weather data using Ollama for ${city}, dates: ${startDate} to ${endDate}`);
      
      // Generate ALL weather data using Ollama AI
      const aiWeatherData = await this.generateCompleteWeatherData(city, startDate, endDate, trip);
      
      return aiWeatherData;
    } catch (error) {
      console.log(error);
      this.logger.error(`Error generating Ollama weather for ${city}:`, error.message);
      return this.getFallbackWeatherData(city, startDate, endDate);
    }
  }

  private async generateCompleteWeatherData(city: string, startDate: string, endDate: string, trip: string): Promise<WeatherData> {
    try {
      // Generate complete weather data using Ollama
      const weatherPrompt = this.createCompleteWeatherPrompt(city, startDate, endDate, trip);
      const aiResponse = await this.ollamaService.generateResponse(weatherPrompt);
      
      // Parse the AI response to extract structured data
      const parsedData = this.parseOllamaWeatherResponse(aiResponse, city);
      
      return parsedData;
    } catch (error) {
      this.logger.error('Error generating complete weather data from Ollama:', error.message);
      throw error;
    }
  }

  private createCompleteWeatherPrompt(city: string, startDate: string, endDate: string, trip: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startFormatted = start.toLocaleDateString('en-US');
    const endFormatted = end.toLocaleDateString('en-US');
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return `
Create realistic weather information for ${city} for the period from ${startFormatted} to ${endFormatted} (${duration} days).
Note that this trip is for ${trip}
Please provide the following information in a structured format:

TEMPERATURE: [number in celsius depending on season and location]
CONDITION: [one word in English: sunny, cloudy, rainy, partly-cloudy, snow or stormy]
ENGLISH_CONDITION: [English description of weather condition]
FORECAST_ENGLISH: [forecast in English, including temperature range and brief description]
SUMMARY_ENGLISH: [detailed analysis in English of 200-300 words with temperature ranges, humidity, rain chance, sunshine hours and clothing recommendations, for each section ,can add an emoji at the start of each section, for example when talking about clothing recommendations, you can add a 🧥 emoji]

Consider the following:
- The typical climate of ${city}
- The current season and requested period
- Geographic location and seasonal patterns
- Appropriate recommendations for the trip period
- Rain chance, sunshine hours and clothing recommendations

Format the response exactly like this:
TEMPERATURE: 25
CONDITION: sunny
ENGLISH_CONDITION: Bright sunshine
FORECAST_ENGLISH: ${startFormatted} - ${endFormatted}: Expected temperature 22–28°C, bright sunshine most days
SUMMARY_ENGLISH: [detailed analysis here in English...]

Create a realistic forecast for ${city} during this period.
`;
  }

  private parseOllamaWeatherResponse(aiResponse: string, city: string): WeatherData {
    try {
      // Parse the structured response from Ollama
      const lines = aiResponse.split('\n');
      let temperature = 25;
      let condition = 'partly-cloudy';
      let englishCondition = 'Pleasant weather';
      let forecast = '';
      let summary = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('TEMPERATURE:')) {
          temperature = parseInt(trimmedLine.split(':')[1].trim()) || 25;
        } else if (trimmedLine.startsWith('CONDITION:')) {
          condition = trimmedLine.split(':')[1].trim().toLowerCase();
        } else if (trimmedLine.startsWith('ENGLISH_CONDITION:')) {
          englishCondition = trimmedLine.split(':')[1].trim();
        } else if (trimmedLine.startsWith('FORECAST_ENGLISH:')) {
          forecast = trimmedLine.split(':').slice(1).join(':').trim();
        } else if (trimmedLine.startsWith('SUMMARY_ENGLISH:')) {
          summary = trimmedLine.split(':').slice(1).join(':').trim();
        }
      }

      // If summary is incomplete, extract the rest
      const summaryStartIndex = aiResponse.indexOf('SUMMARY_ENGLISH:');
      if (summaryStartIndex !== -1 && summary.length < 50) {
        summary = aiResponse
          .substring(summaryStartIndex + 'SUMMARY_ENGLISH:'.length)
          .trim();
      }

      return {
        icon: this.getWeatherIcon(condition),
        temperature: Math.round(temperature),
        condition: englishCondition,
        forecast: forecast || `${this.getWeatherIcon(condition)} Forecast for ${city}: ${englishCondition}, temperature ${temperature}°C`,
        summary: summary || `The weather in ${city} is expected to be ${englishCondition} with a temperature of ${temperature}°C.`
      };
    } catch (error) {
      this.logger.error('Error parsing Ollama response:', error.message);
      // Return fallback with Ollama-generated basic data
      return {
        icon: '🌤️',
        temperature: 25,
        condition: 'Pleasant weather',
        forecast: `🌤️ Forecast for ${city}: Pleasant weather`,
        summary: aiResponse.substring(0, 300) || `The weather in ${city} looks pleasant.`
      };
    }
  }

  private getWeatherIcon(condition: string): string {
    const iconMap = {
      'sunny': '☀️',
      'clear': '☀️',
      'partly-cloudy': '🌤️',
      'cloudy': '☁️',
      'overcast': '☁️',
      'rainy': '🌧️',
      'rain': '🌧️',
      'stormy': '⛈️',
      'snow': '❄️',
      'fog': '🌫️',
      'windy': '💨'
    };
    
    return iconMap[condition.toLowerCase()] || '🌤️';
  }

  private translateCondition(condition: string): string {
    const conditionMap = {
      'sunny': 'Bright sunshine',
      'clear': 'Clear skies',
      'partly-cloudy': 'Partly cloudy',
      'cloudy': 'Cloudy',
      'overcast': 'Overcast',
      'rainy': 'Rainy',
      'rain': 'Rain',
      'stormy': 'Stormy',
      'snow': 'Snowy',
      'fog': 'Foggy',
      'windy': 'Windy'
    };
    
    return conditionMap[condition.toLowerCase()] || 'Pleasant weather';
  }

  private getFallbackWeatherData(city: string, startDate: string, endDate: string): WeatherData {
    return {
      icon: '',
      temperature: -1,
      condition: 'Unknown',
      forecast: 'Unable to load weather forecast at this time',
      summary: 'Unable to load weather forecast at this time'
    };
  }
}
