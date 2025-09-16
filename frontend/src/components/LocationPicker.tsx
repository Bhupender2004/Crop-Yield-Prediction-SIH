import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { WeatherService, LocationData, WeatherData } from '@/services/weatherService';

interface LocationPickerProps {
  onLocationSelect: (location: LocationData, weather: WeatherData) => void;
  selectedLocation?: LocationData;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  selectedLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);

  // Search for locations
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await WeatherService.searchLocations(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await WeatherService.getCurrentLocation();
      const weather = await WeatherService.getCurrentWeather(location.lat, location.lon);
      setCurrentWeather(weather);
      onLocationSelect(location, weather);
    } catch (error) {
      console.error('Location error:', error);
      // Fallback to mock data
      try {
        const mockWeather = await WeatherService.getMockWeatherData('USA');
        const mockLocation: LocationData = {
          lat: 40.7128,
          lon: -74.0060,
          name: 'New York',
          country: 'US'
        };
        setCurrentWeather(mockWeather);
        onLocationSelect(mockLocation, mockWeather);
      } catch (mockError) {
        console.error('Mock data error:', mockError);
      }
    }
    setIsGettingLocation(false);
  };

  // Select a location from search results
  const handleLocationSelect = async (location: LocationData) => {
    try {
      const weather = await WeatherService.getCurrentWeather(location.lat, location.lon);
      setCurrentWeather(weather);
      onLocationSelect(location, weather);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Weather fetch error:', error);
      // Use mock data as fallback
      const mockWeather = await WeatherService.getMockWeatherData(location.country);
      setCurrentWeather(mockWeather);
      onLocationSelect(location, mockWeather);
    }
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location & Weather Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Button */}
        <Button
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className="w-full"
          variant="outline"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          Use Current Location
        </Button>

        {/* Search Location */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for a city or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="icon"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <div className="text-sm font-medium text-gray-600">Search Results:</div>
            {searchResults.map((location, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleLocationSelect(location)}
              >
                <div>
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-gray-500">{location.country}</div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-green-800">Selected Location</div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
            <div className="text-sm text-green-700">
              {selectedLocation.name}, {selectedLocation.country}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
            </div>
          </div>
        )}

        {/* Current Weather Display */}
        {currentWeather && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800">{currentWeather.temperature}°C</div>
              <div className="text-xs text-blue-600">Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800">{currentWeather.humidity}%</div>
              <div className="text-xs text-blue-600">Humidity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800">{currentWeather.rainfall}mm</div>
              <div className="text-xs text-blue-600">Rainfall</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
          💡 Tip: Use your current location for the most accurate weather data, or search for a specific location to get localized predictions.
        </div>
      </CardContent>
    </Card>
  );
};
