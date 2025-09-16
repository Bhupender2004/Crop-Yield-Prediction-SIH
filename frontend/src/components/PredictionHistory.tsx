import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, History, FileText, Trash2, Eye } from 'lucide-react';

interface PredictionRecord {
  id: string;
  timestamp: Date;
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
  location?: {
    name: string;
    country: string;
  };
}

interface PredictionHistoryProps {
  currentPrediction?: {
    inputData: any;
    prediction: any;
    location?: any;
  };
  onViewPrediction?: (record: PredictionRecord) => void;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({
  currentPrediction,
  onViewPrediction
}) => {
  const [history, setHistory] = useState<PredictionRecord[]>([]);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('predictionHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        })));
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  // Save current prediction to history
  useEffect(() => {
    if (currentPrediction) {
      const newRecord: PredictionRecord = {
        id: Date.now().toString(),
        timestamp: new Date(),
        inputData: currentPrediction.inputData,
        prediction: currentPrediction.prediction,
        location: currentPrediction.location
      };

      const updatedHistory = [newRecord, ...history].slice(0, 50); // Keep last 50 records
      setHistory(updatedHistory);
      localStorage.setItem('predictionHistory', JSON.stringify(updatedHistory));
    }
  }, [currentPrediction]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Time',
      'Crop',
      'Country',
      'Year',
      'Rainfall (mm)',
      'Temperature (°C)',
      'Pesticides (tonnes)',
      'Predicted Yield (kg/ha)',
      'Confidence (%)',
      'Location'
    ];

    const csvData = history.map(record => [
      record.timestamp.toLocaleDateString(),
      record.timestamp.toLocaleTimeString(),
      record.inputData.item,
      record.inputData.country,
      record.inputData.year,
      record.inputData.rainfall,
      record.inputData.avgTemp,
      record.inputData.pesticides,
      record.prediction.yield.toFixed(0),
      record.prediction.confidence,
      record.location ? `${record.location.name}, ${record.location.country}` : 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `crop_predictions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (simplified - in production, use a proper PDF library)
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Crop Yield Prediction History</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #10b981; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Crop Yield Prediction History</h1>
            <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Crop</th>
                <th>Country</th>
                <th>Rainfall</th>
                <th>Temperature</th>
                <th>Predicted Yield</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(record => `
                <tr>
                  <td>${record.timestamp.toLocaleDateString()}</td>
                  <td>${record.inputData.item}</td>
                  <td>${record.inputData.country}</td>
                  <td>${record.inputData.rainfall} mm</td>
                  <td>${record.inputData.avgTemp}°C</td>
                  <td>${record.prediction.yield.toLocaleString()} kg/ha</td>
                  <td>${record.prediction.confidence}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Clear history
  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all prediction history?')) {
      setHistory([]);
      localStorage.removeItem('predictionHistory');
    }
  };

  // Delete specific record
  const deleteRecord = (id: string) => {
    const updatedHistory = history.filter(record => record.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('predictionHistory', JSON.stringify(updatedHistory));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Prediction History ({history.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              disabled={history.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={exportToPDF}
              variant="outline"
              size="sm"
              disabled={history.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              onClick={clearHistory}
              variant="outline"
              size="sm"
              disabled={history.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No prediction history available.</p>
            <p className="text-sm">Make your first prediction to see it here!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div>{record.timestamp.toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          {record.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{record.inputData.item}</div>
                      <div className="text-sm text-gray-500">
                        Year: {record.inputData.year}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{record.inputData.country}</div>
                      {record.location && (
                        <div className="text-sm text-gray-500">
                          {record.location.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {record.prediction.yield.toLocaleString()} kg/ha
                      </div>
                      <div className="text-sm text-gray-500">
                        R: {record.inputData.rainfall}mm, T: {record.inputData.avgTemp}°C
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getConfidenceColor(record.prediction.confidence)}>
                        {record.prediction.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {onViewPrediction && (
                          <Button
                            onClick={() => onViewPrediction(record)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteRecord(record.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
