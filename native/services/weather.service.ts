// OpenWeatherMap API Integration for React Native
// Docs: https://openweathermap.org/api

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your_openweather_api_key';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  name: string;
  dt: number;
}

export interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    dt_txt: string;
  }>;
  city: {
    name: string;
    country: string;
  };
}

class WeatherService {
  private apiKey: string;

  constructor() {
    this.apiKey = WEATHER_API_KEY;
  }

  /**
   * Make API request to OpenWeatherMap
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        appid: this.apiKey,
        units: 'metric', // Celsius
        ...params,
      });

      const url = `${WEATHER_BASE_URL}${endpoint}?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Weather API request failed:', error);
      throw error;
    }
  }

  /**
   * Get current weather by city name
   */
  async getCurrentWeatherByCity(city: string): Promise<WeatherData | null> {
    try {
      const response = await this.makeRequest('/weather', { q: city });
      return response;
    } catch (error) {
      console.error('Failed to get weather by city:', error);
      return null;
    }
  }

  /**
   * Get current weather by coordinates
   */
  async getCurrentWeatherByCoords(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const response = await this.makeRequest('/weather', { lat, lon });
      return response;
    } catch (error) {
      console.error('Failed to get weather by coordinates:', error);
      return null;
    }
  }

  /**
   * Get 5-day weather forecast
   */
  async getForecast(city: string): Promise<ForecastData | null> {
    try {
      const response = await this.makeRequest('/forecast', { q: city });
      return response;
    } catch (error) {
      console.error('Failed to get weather forecast:', error);
      return null;
    }
  }

  /**
   * Get weather icon URL
   */
  getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  }

  /**
   * Format temperature
   */
  formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
    if (unit === 'F') {
      temp = (temp * 9/5) + 32;
    }
    return `${Math.round(temp)}°${unit}`;
  }

  /**
   * Get weather condition emoji
   */
  getWeatherEmoji(weatherMain: string): string {
    const emojiMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
    };
    return emojiMap[weatherMain] || '🌤️';
  }

  /**
   * Format weather for display
   */
  formatWeatherForDisplay(weather: WeatherData) {
    return {
      location: weather.name,
      country: weather.sys.country,
      temperature: this.formatTemperature(weather.main.temp),
      feelsLike: this.formatTemperature(weather.main.feels_like),
      description: weather.weather[0].description,
      main: weather.weather[0].main,
      emoji: this.getWeatherEmoji(weather.weather[0].main),
      icon: this.getWeatherIconUrl(weather.weather[0].icon),
      humidity: `${weather.main.humidity}%`,
      windSpeed: `${weather.wind.speed} m/s`,
      pressure: `${weather.main.pressure} hPa`,
      coordinates: {
        lat: weather.coord.lat,
        lon: weather.coord.lon,
      },
    };
  }
}

// Singleton instance
export const weatherService = new WeatherService();

// Export convenience functions
export const getCurrentWeather = (city: string) => 
  weatherService.getCurrentWeatherByCity(city);

export const getCurrentWeatherByLocation = (lat: number, lon: number) => 
  weatherService.getCurrentWeatherByCoords(lat, lon);

export const getWeatherForecast = (city: string) => 
  weatherService.getForecast(city);
