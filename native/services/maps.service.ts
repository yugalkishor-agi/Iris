// Google Maps API Integration for React Native
// Docs: https://developers.google.com/maps/documentation/

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'your_google_maps_api_key';
const MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  types: string[];
  vicinity?: string;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
}

export interface PlaceSearchResult {
  results: PlaceDetails[];
  status: string;
  next_page_token?: string;
}

export interface GeocodeResult {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
    types: string[];
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

class MapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_MAPS_API_KEY;
  }

  /**
   * Make API request to Google Maps
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        key: this.apiKey,
        ...params,
      });

      const url = `${MAPS_BASE_URL}${endpoint}?${queryParams}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Maps API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Maps API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for places by text query
   */
  async searchPlaces(query: string, location?: Location, radius?: number): Promise<PlaceDetails[]> {
    try {
      const params: Record<string, any> = {
        query,
      };

      if (location) {
        params.location = `${location.latitude},${location.longitude}`;
        if (radius) {
          params.radius = radius;
        }
      }

      const response = await this.makeRequest('/place/textsearch/json', params);
      return response.results || [];
    } catch (error) {
      console.error('Failed to search places:', error);
      return [];
    }
  }

  /**
   * Search for nearby places
   */
  async searchNearbyPlaces(
    location: Location,
    radius: number = 1000,
    type?: string,
    keyword?: string
  ): Promise<PlaceDetails[]> {
    try {
      const params: Record<string, any> = {
        location: `${location.latitude},${location.longitude}`,
        radius,
      };

      if (type) params.type = type;
      if (keyword) params.keyword = keyword;

      const response = await this.makeRequest('/place/nearbysearch/json', params);
      return response.results || [];
    } catch (error) {
      console.error('Failed to search nearby places:', error);
      return [];
    }
  }

  /**
   * Get place details by place ID
   */
  async getPlaceDetails(placeId: string, fields?: string[]): Promise<PlaceDetails | null> {
    try {
      const params: Record<string, any> = {
        place_id: placeId,
      };

      if (fields?.length) {
        params.fields = fields.join(',');
      }

      const response = await this.makeRequest('/place/details/json', params);
      return response.result || null;
    } catch (error) {
      console.error('Failed to get place details:', error);
      return null;
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<Location | null> {
    try {
      const response = await this.makeRequest('/geocode/json', {
        address,
      });

      if (response.results?.length > 0) {
        const location = response.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to geocode address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(location: Location): Promise<string | null> {
    try {
      const response = await this.makeRequest('/geocode/json', {
        latlng: `${location.latitude},${location.longitude}`,
      });

      if (response.results?.length > 0) {
        return response.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      return null;
    }
  }

  /**
   * Get autocomplete suggestions for places
   */
  async getPlaceAutocomplete(input: string, location?: Location, radius?: number): Promise<any[]> {
    try {
      const params: Record<string, any> = {
        input,
      };

      if (location) {
        params.location = `${location.latitude},${location.longitude}`;
        if (radius) {
          params.radius = radius;
        }
      }

      const response = await this.makeRequest('/place/autocomplete/json', params);
      return response.predictions || [];
    } catch (error) {
      console.error('Failed to get place autocomplete:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get static map image URL
   */
  getStaticMapUrl(
    center: Location,
    zoom: number = 15,
    size: string = '400x400',
    markers?: Array<{
      location: Location;
      color?: string;
      label?: string;
    }>
  ): string {
    const params = new URLSearchParams({
      center: `${center.latitude},${center.longitude}`,
      zoom: zoom.toString(),
      size,
      key: this.apiKey,
    });

    if (markers?.length) {
      markers.forEach((marker, index) => {
        let markerParam = `${marker.location.latitude},${marker.location.longitude}`;
        if (marker.color) markerParam = `color:${marker.color}|${markerParam}`;
        if (marker.label) markerParam = `label:${marker.label}|${markerParam}`;
        params.append('markers', markerParam);
      });
    }

    return `${MAPS_BASE_URL}/staticmap?${params}`;
  }

  /**
   * Get place photo URL
   */
  getPlacePhotoUrl(photoReference: string, maxWidth: number = 400): string {
    const params = new URLSearchParams({
      photoreference: photoReference,
      maxwidth: maxWidth.toString(),
      key: this.apiKey,
    });

    return `${MAPS_BASE_URL}/place/photo?${params}`;
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: Location,
    destination: Location,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<any> {
    try {
      const response = await this.makeRequest('/directions/json', {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode,
      });

      return response;
    } catch (error) {
      console.error('Failed to get directions:', error);
      return null;
    }
  }

  /**
   * Format place for display
   */
  formatPlaceForDisplay(place: PlaceDetails) {
    return {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      rating: place.rating,
      types: place.types,
      photos: place.photos?.map(photo => ({
        url: this.getPlacePhotoUrl(photo.photo_reference),
        width: photo.width,
        height: photo.height,
      })) || [],
      priceLevel: place.price_level,
      openNow: place.opening_hours?.open_now,
    };
  }
}

// Singleton instance
export const mapsService = new MapsService();

// Export convenience functions
export const searchPlaces = (query: string, location?: Location, radius?: number) => 
  mapsService.searchPlaces(query, location, radius);

export const searchNearbyPlaces = (location: Location, radius?: number, type?: string) => 
  mapsService.searchNearbyPlaces(location, radius, type);

export const geocodeAddress = (address: string) => 
  mapsService.geocodeAddress(address);

export const reverseGeocode = (location: Location) => 
  mapsService.reverseGeocode(location);

export const getPlaceAutocomplete = (input: string, location?: Location) => 
  mapsService.getPlaceAutocomplete(input, location);
