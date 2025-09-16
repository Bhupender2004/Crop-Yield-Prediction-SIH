// Weather service for fetching live weather data
export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  location: string;
  country: string;
}

export interface LocationData {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

// Free weather API service using OpenWeatherMap
const WEATHER_API_KEY = 'your_openweather_api_key'; // Replace with your API key
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE_URL = 'https://api.openweathermap.org/geo/1.0';

export class WeatherService {
  // Get user's current location
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve(locationData);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(new Error(`Location access denied: ${error.message}`));
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  // Reverse geocoding to get location name from coordinates
  static async reverseGeocode(lat: number, lon: number): Promise<LocationData> {
    try {
      const response = await fetch(
        `${GEO_BASE_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get location data');
      }

      const data = await response.json();
      if (data.length === 0) {
        throw new Error('Location not found');
      }

      return {
        lat,
        lon,
        name: data[0].name,
        country: data[0].country
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  // Search for locations by name
  static async searchLocations(query: string): Promise<LocationData[]> {
    try {
      const response = await fetch(
        `${GEO_BASE_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${WEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search locations');
      }

      const data = await response.json();
      return data.map((item: any) => ({
        lat: item.lat,
        lon: item.lon,
        name: item.name,
        country: item.country
      }));
    } catch (error) {
      console.error('Location search error:', error);
      throw error;
    }
  }

  // Get current weather data
  static async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      
      return {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        rainfall: data.rain?.['1h'] || 0, // Rainfall in last hour
        location: data.name,
        country: data.sys.country
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      throw error;
    }
  }

  // Get historical weather data (for rainfall estimation)
  static async getHistoricalWeather(lat: number, lon: number): Promise<number> {
    try {
      // For demo purposes, we'll estimate annual rainfall
      // In production, you'd use a historical weather API
      const currentWeather = await this.getCurrentWeather(lat, lon);
      
      // Estimate annual rainfall based on current humidity and location
      // This is a simplified calculation - use proper historical data in production
      const estimatedAnnualRainfall = currentWeather.humidity * 10 + Math.random() * 500;
      
      return Math.round(estimatedAnnualRainfall);
    } catch (error) {
      console.error('Historical weather error:', error);
      throw error;
    }
  }

  // Mock function for demo - replace with actual API key
  static async getMockWeatherData(location: string): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data based on location
    const mockData: { [key: string]: WeatherData } = {
      'India': {
        temperature: 28,
        humidity: 75,
        rainfall: 1200,
        location: 'New Delhi',
        country: 'India'
      },
      'Brazil': {
        temperature: 25,
        humidity: 80,
        rainfall: 1500,
        location: 'São Paulo',
        country: 'Brazil'
      },
      'USA': {
        temperature: 22,
        humidity: 65,
        rainfall: 800,
        location: 'Iowa',
        country: 'United States'
      }
    };

    return mockData[location] || {
      temperature: 20,
      humidity: 60,
      rainfall: 600,
      location: 'Unknown',
      country: location
    };
  }
}
