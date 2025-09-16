import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Leaf, Droplets, Thermometer, Bug } from 'lucide-react';

interface RecommendationEngineProps {
  inputData: {
    year: string;
    rainfall: string;
    pesticides: string;
    avgTemp: string;
    country: string;
    item: string;
  };
  prediction: {
    yield: number;
    confidence: number;
    factors: {
      rainfall: string;
      temperature: string;
      pesticides: string;
    };
  };
  weatherData?: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
}

interface Recommendation {
  type: 'crop' | 'fertilizer' | 'irrigation' | 'pest' | 'timing';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  inputData,
  prediction,
  weatherData
}) => {
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    const rainfall = parseFloat(inputData.rainfall);
    const temperature = parseFloat(inputData.avgTemp);
    const pesticides = parseFloat(inputData.pesticides);

    // Crop recommendations based on conditions
    if (temperature > 30) {
      recommendations.push({
        type: 'crop',
        title: 'Heat-Resistant Varieties',
        description: 'Consider drought-resistant varieties like sorghum or millet for high temperature conditions.',
        priority: 'high',
        icon: <Thermometer className="h-4 w-4" />
      });
    }

    if (rainfall > 1500) {
      recommendations.push({
        type: 'crop',
        title: 'Water-Loving Crops',
        description: 'High rainfall conditions are ideal for rice, sugarcane, or tropical fruits.',
        priority: 'medium',
        icon: <Droplets className="h-4 w-4" />
      });
    } else if (rainfall < 500) {
      recommendations.push({
        type: 'irrigation',
        title: 'Irrigation System',
        description: 'Install drip irrigation or sprinkler systems to compensate for low rainfall.',
        priority: 'high',
        icon: <Droplets className="h-4 w-4" />
      });
    }

    // Fertilizer recommendations
    if (prediction.yield < 5000) {
      recommendations.push({
        type: 'fertilizer',
        title: 'Soil Enhancement',
        description: 'Apply NPK fertilizer (10-26-26) and organic compost to improve soil fertility.',
        priority: 'high',
        icon: <Leaf className="h-4 w-4" />
      });
    }

    if (pesticides < 1) {
      recommendations.push({
        type: 'pest',
        title: 'Pest Management',
        description: 'Implement integrated pest management with organic pesticides and beneficial insects.',
        priority: 'medium',
        icon: <Bug className="h-4 w-4" />
      });
    }

    // Timing recommendations
    if (inputData.item.toLowerCase().includes('wheat') && temperature < 15) {
      recommendations.push({
        type: 'timing',
        title: 'Optimal Planting Time',
        description: 'Plant wheat in late fall for winter varieties or early spring for spring varieties.',
        priority: 'medium',
        icon: <Lightbulb className="h-4 w-4" />
      });
    }

    // Weather-based recommendations
    if (weatherData) {
      if (weatherData.humidity > 80) {
        recommendations.push({
          type: 'pest',
          title: 'Fungal Disease Prevention',
          description: 'High humidity increases fungal disease risk. Apply preventive fungicides.',
          priority: 'high',
          icon: <Bug className="h-4 w-4" />
        });
      }
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crop': return <Leaf className="h-5 w-5 text-green-600" />;
      case 'fertilizer': return <Leaf className="h-5 w-5 text-blue-600" />;
      case 'irrigation': return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'pest': return <Bug className="h-5 w-5 text-red-600" />;
      case 'timing': return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      default: return <Lightbulb className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Smart Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No specific recommendations at this time.</p>
            <p className="text-sm">Your current conditions look optimal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(rec.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(rec.priority)}
                    >
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">💡 General Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Monitor soil pH levels regularly (optimal: 6.0-7.0)</li>
            <li>• Rotate crops to maintain soil health</li>
            <li>• Use organic matter to improve soil structure</li>
            <li>• Consider companion planting for natural pest control</li>
          </ul>
        </div>

        {/* Fertilizer Schedule */}
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-900 mb-2">🌱 Fertilizer Schedule</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="text-green-800">
              <div className="font-medium">Pre-Planting</div>
              <div>Organic compost + Base fertilizer</div>
            </div>
            <div className="text-green-800">
              <div className="font-medium">Mid-Season</div>
              <div>Nitrogen boost + Micronutrients</div>
            </div>
            <div className="text-green-800">
              <div className="font-medium">Pre-Harvest</div>
              <div>Potassium supplement</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
