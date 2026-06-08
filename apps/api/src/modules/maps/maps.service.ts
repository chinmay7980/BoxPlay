import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  async fetchTurfsFromGoogle(city: string, query: string): Promise<any[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Fallback to mocked data if no API key is set
    if (!apiKey || apiKey === 'your_api_key_here') {
      this.logger.warn('No GOOGLE_MAPS_API_KEY found in env, returning mocked data for demonstration');
      return this.getMockedData(city);
    }

    // Real API call logic
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' in ' + city)}&key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results || [];
    } catch (err) {
      this.logger.error('Failed to fetch from Google Maps', err);
      return [];
    }
  }

  private getMockedData(city: string) {
    if (city.toLowerCase() === 'udaipur') {
      return [
        {
          name: 'Royal Rajputana Turf',
          formatted_address: '100ft Road, Shobhagpura, Udaipur',
          rating: 4.8,
          user_ratings_total: 124,
          geometry: { location: { lat: 24.6001, lng: 73.7001 } },
        },
        {
          name: 'Mewar Sports Arena',
          formatted_address: 'Fatehpura Circle, Udaipur',
          rating: 4.5,
          user_ratings_total: 89,
          geometry: { location: { lat: 24.6102, lng: 73.6905 } },
        },
        {
          name: 'Lakecity Football Ground',
          formatted_address: 'Sector 4, Hiran Magri, Udaipur',
          rating: 4.2,
          user_ratings_total: 210,
          geometry: { location: { lat: 24.5701, lng: 73.7121 } },
        }
      ];
    }
    return [
      {
        name: `City Turf ${city}`,
        formatted_address: `Main Street, ${city}`,
        rating: 4.0,
        user_ratings_total: 50,
        geometry: { location: { lat: 20.0, lng: 70.0 } },
      }
    ];
  }
}
