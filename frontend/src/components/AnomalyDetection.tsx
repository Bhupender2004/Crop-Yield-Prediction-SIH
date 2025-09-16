import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, TrendingDown, Thermometer, Droplets, Bug } from 'lucide-react';

interface AnomalyDetectionProps {
  prediction: {
    yield: number;
    confidence: number;
    factors: {
      rainfall: string;
      temperature: string;
      pesticides: string;
    };
  };
  inputData: {
    year: string;
    rainfall: string;
    pesticides: string;
    avgTemp: string;
    country: string;
    item: string;
  };
}

interface Anomaly {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  reasons: string[];
  suggestions: string[];
  icon: React.ReactNode;
}

export const AnomalyDetection: React.FC<AnomalyDetectionProps> = ({
  prediction,
  inputData
}) => {
  const detectAnomalies = (): Anomaly[] => {
    const anomalies: Anomaly[] = [];
    const rainfall = parseFloat(inputData.rainfall);
    const temperature = parseFloat(inputData.avgTemp);
    const pesticides = parseFloat(inputData.pesticides);
    const yield_value = prediction.yield;

    // Define expected yield ranges for different crops (simplified)
    const expectedYields: { [key: string]: { min: number; max: number; optimal: number } } = {
      'wheat': { min: 2000, max: 8000, optimal: 5000 },
      'rice': { min: 3000, max: 10000, optimal: 6500 },
      'maize': { min: 4000, max: 12000, optimal: 8000 },
      'soybeans': { min: 1500, max: 4000, optimal: 2500 },
      'potatoes': { min: 20000, max: 60000, optimal: 40000 },
      'cassava': { min: 8000, max: 25000, optimal: 15000 }
    };

    const cropType = inputData.item.toLowerCase();
    const expectedYield = expectedYields[cropType] || { min: 1000, max: 10000, optimal: 5000 };

    // Critical: Very low yield prediction
    if (yield_value < expectedYield.min * 0.5) {
      const reasons = [];
      const suggestions = [];

      if (rainfall < 300) {
        reasons.push('Extremely low rainfall (drought conditions)');
        suggestions.push('Implement emergency irrigation systems');
        suggestions.push('Consider drought-resistant crop varieties');
      }

      if (temperature > 35) {
        reasons.push('Excessive heat stress');
        suggestions.push('Provide shade or cooling systems');
        suggestions.push('Adjust planting schedule to avoid peak heat');
      }

      if (temperature < 5) {
        reasons.push('Frost or freezing conditions');
        suggestions.push('Use frost protection methods');
        suggestions.push('Consider greenhouse cultivation');
      }

      if (pesticides > 5) {
        reasons.push('Excessive pesticide use may harm beneficial organisms');
        suggestions.push('Reduce pesticide application');
        suggestions.push('Implement integrated pest management');
      }

      if (prediction.confidence < 60) {
        reasons.push('Low model confidence due to unusual input combinations');
        suggestions.push('Verify input data accuracy');
        suggestions.push('Consult local agricultural experts');
      }

      anomalies.push({
        type: 'critical',
        title: 'Critical Yield Alert',
        description: `Predicted yield (${yield_value.toLocaleString()} kg/ha) is critically low for ${inputData.item}.`,
        reasons,
        suggestions,
        icon: <AlertTriangle className="h-5 w-5" />
      });
    }
    // Warning: Below optimal yield
    else if (yield_value < expectedYield.optimal * 0.7) {
      const reasons = [];
      const suggestions = [];

      if (rainfall < 500) {
        reasons.push('Below-average rainfall');
        suggestions.push('Supplement with irrigation');
      }

      if (temperature < 10 || temperature > 30) {
        reasons.push('Sub-optimal temperature conditions');
        suggestions.push('Consider climate-appropriate varieties');
      }

      if (pesticides < 0.5) {
        reasons.push('Insufficient pest protection');
        suggestions.push('Increase pest monitoring and control');
      }

      anomalies.push({
        type: 'warning',
        title: 'Below Optimal Yield',
        description: `Predicted yield is below optimal levels for ${inputData.item} in ${inputData.country}.`,
        reasons,
        suggestions,
        icon: <TrendingDown className="h-5 w-5" />
      });
    }

    // Environmental stress warnings
    if (rainfall > 2000) {
      anomalies.push({
        type: 'warning',
        title: 'Excessive Rainfall Warning',
        description: 'Very high rainfall may cause waterlogging and root diseases.',
        reasons: ['Potential waterlogging', 'Increased disease pressure', 'Nutrient leaching'],
        suggestions: [
          'Improve field drainage',
          'Apply fungicides preventively',
          'Monitor for root rot diseases'
        ],
        icon: <Droplets className="h-5 w-5" />
      });
    }

    if (temperature > 40) {
      anomalies.push({
        type: 'critical',
        title: 'Extreme Heat Warning',
        description: 'Dangerously high temperatures detected.',
        reasons: ['Heat stress on crops', 'Increased water demand', 'Potential crop failure'],
        suggestions: [
          'Provide immediate shade',
          'Increase irrigation frequency',
          'Consider emergency harvesting'
        ],
        icon: <Thermometer className="h-5 w-5" />
      });
    }

    // Confidence-based warnings
    if (prediction.confidence < 70) {
      anomalies.push({
        type: 'info',
        title: 'Low Prediction Confidence',
        description: `Model confidence is ${prediction.confidence}%, indicating uncertainty in the prediction.`,
        reasons: [
          'Unusual combination of input parameters',
          'Limited training data for this scenario',
          'Potential data quality issues'
        ],
        suggestions: [
          'Double-check input values',
          'Consult local agricultural extension services',
          'Consider multiple prediction models'
        ],
        icon: <Info className="h-5 w-5" />
      });
    }

    return anomalies;
  };

  const anomalies = detectAnomalies();

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (anomalies.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <AlertCircle className="h-5 w-5" />
            System Status: Normal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-green-800 mb-2">All Systems Normal</h3>
            <p className="text-green-600">
              No anomalies detected. Your prediction parameters are within expected ranges.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Anomaly Detection & Warnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {anomalies.map((anomaly, index) => (
          <Alert key={index} className={getAlertColor(anomaly.type)}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {anomaly.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">{anomaly.title}</h4>
                  <Badge className={getBadgeColor(anomaly.type)}>
                    {anomaly.type.toUpperCase()}
                  </Badge>
                </div>
                <AlertDescription className="mb-3">
                  {anomaly.description}
                </AlertDescription>
                
                {anomaly.reasons.length > 0 && (
                  <div className="mb-3">
                    <div className="font-medium text-sm mb-1">Possible Reasons:</div>
                    <ul className="text-sm space-y-1">
                      {anomaly.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {anomaly.suggestions.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mb-1">Recommended Actions:</div>
                    <ul className="text-sm space-y-1">
                      {anomaly.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
