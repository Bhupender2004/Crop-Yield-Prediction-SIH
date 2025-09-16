import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface PredictionChartsProps {
  prediction: {
    yield: number;
    unit: string;
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
  historicalData?: Array<{
    year: number;
    yield: number;
  }>;
}

export const PredictionCharts: React.FC<PredictionChartsProps> = ({
  prediction,
  inputData,
  historicalData = []
}) => {
  // Prepare data for factor analysis chart
  const factorData = [
    {
      name: 'Rainfall',
      value: parseFloat(inputData.rainfall),
      impact: prediction.factors.rainfall === 'High' ? 85 : prediction.factors.rainfall === 'Medium' ? 60 : 35,
      color: '#10b981'
    },
    {
      name: 'Temperature',
      value: parseFloat(inputData.avgTemp),
      impact: prediction.factors.temperature === 'High' ? 80 : prediction.factors.temperature === 'Medium' ? 55 : 30,
      color: '#f59e0b'
    },
    {
      name: 'Pesticides',
      value: parseFloat(inputData.pesticides),
      impact: prediction.factors.pesticides === 'High' ? 70 : prediction.factors.pesticides === 'Medium' ? 50 : 25,
      color: '#ef4444'
    }
  ];

  // Prepare confidence data
  const confidenceData = [
    { name: 'Confidence', value: prediction.confidence, color: '#10b981' },
    { name: 'Uncertainty', value: 100 - prediction.confidence, color: '#e5e7eb' }
  ];

  // Prepare yield comparison data
  const yieldComparisonData = [
    {
      category: 'Predicted Yield',
      value: prediction.yield,
      color: '#10b981'
    },
    {
      category: 'Average Yield',
      value: prediction.yield * 0.85, // Estimated average
      color: '#6b7280'
    },
    {
      category: 'Optimal Yield',
      value: prediction.yield * 1.2, // Estimated optimal
      color: '#3b82f6'
    }
  ];

  // Generate historical trend data if not provided
  const trendData = historicalData.length > 0 ? historicalData : [
    { year: parseInt(inputData.year) - 4, yield: prediction.yield * 0.8 },
    { year: parseInt(inputData.year) - 3, yield: prediction.yield * 0.85 },
    { year: parseInt(inputData.year) - 2, yield: prediction.yield * 0.9 },
    { year: parseInt(inputData.year) - 1, yield: prediction.yield * 0.95 },
    { year: parseInt(inputData.year), yield: prediction.yield }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Yield Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Yield Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yieldComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} kg/ha`, 'Yield']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Factor Impact Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Factor Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={factorData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" fontSize={12} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'impact' ? `${value}% impact` : `${value} ${name === 'value' ? 'units' : ''}`,
                  name === 'impact' ? 'Impact' : 'Value'
                ]}
              />
              <Bar dataKey="impact" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Historical Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Yield Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} kg/ha`, 'Yield']}
                labelFormatter={(year) => `Year: ${year}`}
              />
              <Line 
                type="monotone" 
                dataKey="yield" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Confidence Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Prediction Confidence</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={confidenceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-4">
            <div className="text-2xl font-bold text-green-600">{prediction.confidence}%</div>
            <div className="text-sm text-gray-600">Confidence Level</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
