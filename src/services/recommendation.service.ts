import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from './ollama.service';

export interface TripPlanData {
  icon: string;
  title: string;
  description: string;
  activities: string;
  summary?: string;
}

export interface MoneySavingTip {
  tip: string;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  
  constructor(private readonly ollamaService: OllamaService) {}

  async getTripPlan(city: string, startDate: string, endDate: string, trip: string): Promise<TripPlanData> {
    try {
      this.logger.log(`Generating trip plan using Ollama for ${city}, dates: ${startDate} to ${endDate}`);
      
      // Generate trip plan using Ollama AI
      const tripPlanData = await this.generateTripPlanData(city, startDate, endDate, trip);
      
      return tripPlanData;
    } catch (error) {
      console.log(error);
      this.logger.error(`Error generating Ollama trip plan for ${city}:`, error.message);
      return this.getFallbackTripPlanData(city, startDate, endDate);
    }
  }

  private async generateTripPlanData(city: string, startDate: string, endDate: string, trip: string): Promise<TripPlanData> {
    try {
      // Generate trip plan using Ollama
      const tripPlanPrompt = this.createTripPlanPrompt(city, startDate, endDate, trip);
      const aiResponse = await this.ollamaService.generateResponse(tripPlanPrompt);
      
      // Parse the AI response to extract structured data
      const parsedData = this.parseOllamaTripPlanResponse(aiResponse, city);
      
      return parsedData;
    } catch (error) {
      this.logger.error('Error generating trip plan data from Ollama:', error.message);
      throw error;
    }
  }

  private createTripPlanPrompt(city: string, startDate: string, endDate: string, trip: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startFormatted = start.toLocaleDateString('en-US');
    const endFormatted = end.toLocaleDateString('en-US');
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return `
Create a comprehensive trip plan for ${city} for a ${duration}-day trip from ${startFormatted} to ${endFormatted}.
This trip is for: ${trip}

Please provide the following information in a structured format:

TITLE: [catchy title for the trip plan, 3-5 words]
DESCRIPTION: [brief description of what to expect in ${city}, 1 sentence]
ACTIVITIES: [detailed list of activities and attractions to visit in ${city}, formatted as a single paragraph with bullet points or numbered list]
SUMMARY: [detailed travel guide in English of 200-300 words with day-by-day recommendations, best times to visit attractions, local customs, and practical advice. Add relevant emojis at the start of each section, for example when talking about food, you can add a 🍽️ emoji]

Consider the following:
- The type of trip (${trip})
- The duration of stay (${duration} days)
- Local culture and customs
- Seasonal considerations
- Popular tourist spots and hidden gems
- Practical travel information

Format the response exactly like this:
TITLE: Amazing ${duration}-Day Adventure in ${city}
DESCRIPTION: Discover the best of ${city} with our curated ${duration}-day itinerary featuring must-see attractions and local experiences.
ACTIVITIES: [detailed activities list here...]
SUMMARY: [detailed travel guide here in English...]

Create a practical and enjoyable trip plan for ${city} during this ${duration}-day trip.
`;
  }

  private parseOllamaTripPlanResponse(aiResponse: string, city: string): TripPlanData {
    try {
      // Parse the structured response from Ollama
      const lines = aiResponse.split('\n');
      let title = '';
      let description = '';
      let activities = '';
      let summary = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('TITLE:')) {
          title = trimmedLine.split(':').slice(1).join(':').trim();
        } else if (trimmedLine.startsWith('DESCRIPTION:')) {
          description = trimmedLine.split(':').slice(1).join(':').trim();
        } else if (trimmedLine.startsWith('ACTIVITIES:')) {
          activities = trimmedLine.split(':').slice(1).join(':').trim();
        } else if (trimmedLine.startsWith('SUMMARY:')) {
          summary = trimmedLine.split(':').slice(1).join(':').trim();
        }
      }

      // If summary is incomplete, extract the rest
      const summaryStartIndex = aiResponse.indexOf('SUMMARY:');
      if (summaryStartIndex !== -1 && summary.length < 50) {
        summary = aiResponse
          .substring(summaryStartIndex + 'SUMMARY:'.length)
          .trim();
      }

      return {
        icon: '🗺️',
        title: title || `Trip to ${city}`,
        description: description || `Discover the best of ${city} with our curated itinerary.`,
        activities: activities || `Explore ${city}, visit local attractions, and try local cuisine.`,
        summary: summary || `Discover the best of ${city} with our curated recommendations for activities, attractions, and dining experiences.`
      };
    } catch (error) {
      this.logger.error('Error parsing Ollama trip plan response:', error.message);
      // Return fallback with Ollama-generated basic data
      return {
        icon: '🗺️',
        title: `Trip to ${city}`,
        description: `Discover the best of ${city} with our curated itinerary.`,
        activities: aiResponse.substring(0, 200) || `Explore ${city}, visit local attractions, and try local cuisine.`,
        summary: aiResponse.substring(0, 300) || `Discover the best of ${city} with our curated recommendations.`
      };
    }
  }

  private getFallbackTripPlanData(city: string, startDate: string, endDate: string): TripPlanData {
    return {
      icon: '🗺️',
      title: 'Trip Planning',
      description: `Unable to load trip planning suggestions for ${city} at this time`,
      activities: 'Unable to load trip planning suggestions at this time',
      summary: 'Unable to load trip planning suggestions at this time'
    };
  }

  async getMoneySavingTips(
    cities: string[], 
    startDate: string, 
    endDate: string, 
    tripName: string
  ): Promise<MoneySavingTip> {
    try {
      this.logger.log(`Generating money-saving tips for trip: ${tripName}, cities: ${cities.join(', ')}, dates: ${startDate} to ${endDate}`);
      
      const tipsData = await this.generateMoneySavingTipsData(cities, startDate, endDate, tripName);
      
      return tipsData;
    } catch (error) {
      console.log(error);
      this.logger.error(`Error generating money-saving tips for trip ${tripName}:`, error.message);
      return this.getFallbackMoneySavingTips();
    }
  }

  private async generateMoneySavingTipsData(
    cities: string[], 
    startDate: string, 
    endDate: string, 
    tripName: string
  ): Promise<MoneySavingTip> {
    try {
      const tipsPrompt = this.createMoneySavingTipsPrompt(cities, startDate, endDate, tripName);
      const aiResponse = await this.ollamaService.generateResponse(tipsPrompt);
      
      const parsedData = this.parseMoneySavingTipsResponse(aiResponse);
      
      return parsedData;
    } catch (error) {
      this.logger.error('Error generating money-saving tips from Ollama:', error.message);
      throw error;
    }
  }

  private createMoneySavingTipsPrompt(
    cities: string[], 
    startDate: string, 
    endDate: string, 
    tripName: string
  ): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startFormatted = start.toLocaleDateString('en-US');
    const endFormatted = end.toLocaleDateString('en-US');
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const citiesList = cities.join(', ');
    
    return `
You are a travel expert specializing in budget travel and money-saving tips. 

Create specific money-saving advice for a trip with the following details:
- Trip Name: ${tripName}
- Cities to visit: ${citiesList}
- Travel dates: ${startFormatted} to ${endFormatted} (${duration} days)

Provide practical, specific money-saving tips that are tailored to these cities and this type of trip. Include advice about:
- Transportation options (Uber, public transport, walking)
- Attraction tickets (buying in advance, combo deals, free days)
- Accommodation savings
- Food and dining tips
- Local transportation between cities
- Seasonal considerations for these dates
- Specific deals or passes available in these cities

Format your response exactly like this:
TIP: [Your comprehensive money-saving advice here, <10 words]

Make the tips specific to the cities mentioned and the trip type. Be practical and actionable.
`;
  }

  private parseMoneySavingTipsResponse(aiResponse: string): MoneySavingTip {
    try {
      const lines = aiResponse.split('\n');
      let tip = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('TIP:')) {
          tip = trimmedLine.split(':').slice(1).join(':').trim();
          break;
        }
      }

      // If tip is incomplete, extract the rest
      const tipStartIndex = aiResponse.indexOf('TIP:');
      if (tipStartIndex !== -1 && tip.length < 50) {
        tip = aiResponse
          .substring(tipStartIndex + 'TIP:'.length)
          .trim();
      }

      return {
        tip: tip || 'Consider using public transportation, buying attraction tickets in advance, and looking for local deals to save money on your trip.'
      };
    } catch (error) {
      this.logger.error('Error parsing money-saving tips response:', error.message);
      return {
        tip: aiResponse.substring(0, 300) || 'Consider using public transportation, buying attraction tickets in advance, and looking for local deals to save money on your trip.'
      };
    }
  }

  private getFallbackMoneySavingTips(): MoneySavingTip {
    return {
      tip: 'Consider using public transportation, buying attraction tickets in advance, and looking for local deals to save money on your trip.'
    };
  }
}
