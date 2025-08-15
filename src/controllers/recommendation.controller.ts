import { Controller, Get, Query, Logger } from '@nestjs/common';
import { RecommendationService, TripPlanData } from '../services/recommendation.service';

@Controller('api/v1/plan')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
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
}
