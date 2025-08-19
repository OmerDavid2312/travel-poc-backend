import { Controller, Get, Query, Logger } from '@nestjs/common';
import { RecommendationService, TripPlanData, MoneySavingTip } from '../services/recommendation.service';

@Controller('api/v1/plan')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('trip-plan')
  async getTripPlan(
    @Query('city') city: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('trip') trip: string
  ): Promise<TripPlanData> {
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

    this.logger.log(`Fetching trip plan for city: ${city}, dates: ${startDate} to ${endDate}`);
    
    try {
      const tripPlanData = await this.recommendationService.getTripPlan(city, startDate, endDate, trip);
      this.logger.log(`Successfully retrieved trip plan data for ${city}`);
      console.log(tripPlanData);
      return tripPlanData;
    } catch (error) {
      this.logger.error(`Failed to get trip plan data: ${error.message}`);
      throw error;
    }
  }

  @Get('money-saving-tips')
  async getMoneySavingTips(
    @Query('cities') cities: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('tripName') tripName: string
  ): Promise<MoneySavingTip> {
    if (!cities) {
      throw new Error('Cities parameter is required (comma-separated list)');
    }
    
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate parameters are required (ISO format)');
    }

    if (!tripName) {
      throw new Error('tripName parameter is required');
    }

    // Parse cities array from comma-separated string
    const citiesArray = cities.split(',').map(city => city.trim()).filter(city => city.length > 0);
    
    if (citiesArray.length === 0) {
      throw new Error('At least one city must be provided');
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

    this.logger.log(`Fetching money-saving tips for trip: ${tripName}, cities: ${citiesArray.join(', ')}, dates: ${startDate} to ${endDate}`);
    
    try {
      const tipsData = await this.recommendationService.getMoneySavingTips(citiesArray, startDate, endDate, tripName);
      this.logger.log(`Successfully retrieved money-saving tips for trip: ${tripName}`);
      console.log(tipsData);
      return tipsData;
    } catch (error) {
      this.logger.error(`Failed to get money-saving tips: ${error.message}`);
      throw error;
    }
  }
}
