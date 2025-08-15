import { Controller, Get, Query, Logger } from '@nestjs/common';
import { WeatherService, WeatherData } from '../services/weather.service';

@Controller('api/v1/weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(
    @Query('city') city: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('trip') trip: string
  ): Promise<WeatherData> {
    if (!city) {
      throw new Error('City parameter is required');
    }
    
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate parameters are required (ISO format)');
    }

    if (!trip) {
      throw new Error('trip parameter is required');
    }

    // Validate ISO date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Please use ISO format (e.g., 2024-08-15T10:00:00.000Z)');
    }

    if (start > end) {
      throw new Error('startDate cannot be after endDate');
    }

    this.logger.log(`Fetching weather for city: ${city}, dates: ${startDate} to ${endDate}`);
    
    try {
      const weatherData = await this.weatherService.getWeatherData(city, startDate, endDate, trip);
      this.logger.log(`Successfully retrieved weather data for ${city}`);
      console.log(weatherData);
      return weatherData;
    } catch (error) {
      this.logger.error(`Failed to get weather data: ${error.message}`);
      throw error;
    }
  }
}
