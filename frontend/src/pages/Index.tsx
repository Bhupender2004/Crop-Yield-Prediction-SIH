import { useState } from "react";
import { PredictionForm } from "@/components/PredictionForm";
import { PredictionResult } from "@/components/PredictionResult";
import { PredictionCharts } from "@/components/PredictionCharts";
import { FarmerChatbot } from "@/components/FarmerChatbot";
import { RecommendationEngine } from "@/components/RecommendationEngine";
import { AnomalyDetection } from "@/components/AnomalyDetection";
import { PredictionHistory } from "@/components/PredictionHistory";
import heroImage from "@/assets/hero-agriculture.jpg";
import { Leaf, TrendingUp, BarChart3, MessageCircle, Brain, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PredictionData {
  year: string;
  rainfall: string;
  pesticides: string;
  avgTemp: string;
  country: string;
  item: string;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [inputData, setInputData] = useState<PredictionData | null>(null);
  const [activeTab, setActiveTab] = useState<'predict' | 'history'>('predict');

  const handlePredict = async (data: PredictionData) => {
    setIsLoading(true);
    setInputData(data);
    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          features: [
            parseInt(data.year),
            parseFloat(data.rainfall),
            parseFloat(data.pesticides),
            parseFloat(data.avgTemp),
            data.country,
            data.item
          ]
        })
      });
      const result = await response.json();

      if (result.error) {
        toast({
          title: "Prediction Error",
          description: result.error,
          variant: "destructive",
          duration: 4000
        });
        setPrediction(null);
        return;
      }

      setPrediction({
        yield: result.prediction,
        unit: "kg/hectare",
        confidence: result.confidence || 85,
        factors: {
          rainfall: parseFloat(data.rainfall) > 1000 ? "High" : parseFloat(data.rainfall) > 500 ? "Medium" : "Low",
          temperature: parseFloat(data.avgTemp) > 25 ? "High" : parseFloat(data.avgTemp) > 15 ? "Medium" : "Low",
          pesticides: parseFloat(data.pesticides) > 2 ? "High" : parseFloat(data.pesticides) > 1 ? "Medium" : "Low"
        }
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the prediction service. Please make sure the backend is running.",
        variant: "destructive",
        duration: 4000
      });
      setPrediction(null);
    }
    setIsLoading(false);
  };

  const resetPrediction = () => {
    setPrediction(null);
    setInputData(null);
  };

  const handleViewHistory = (record: any) => {
    setInputData(record.inputData);
    setPrediction(record.prediction);
    setActiveTab('predict');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Agricultural field with modern farming" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Crop Yield Prediction
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl">
              Harness the power of AI to predict crop yields based on environmental factors and agricultural inputs
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Multi-Crop Support</h3>
            <p className="text-muted-foreground">
              Predict yields for over 20 different crop types including wheat, rice, corn, and specialty crops
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">High Accuracy</h3>
            <p className="text-muted-foreground">
              Advanced algorithms consider rainfall, temperature, pesticide usage, and other key factors
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Detailed Insights</h3>
            <p className="text-muted-foreground">
              Get confidence scores and factor analysis to understand what drives your crop yields
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('predict')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'predict'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Brain className="h-4 w-4 inline mr-2" />
              Prediction
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="h-4 w-4 inline mr-2" />
              History
            </button>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'predict' ? (
          <div className="space-y-12">
            {/* Prediction Section */}
            <div className="flex flex-col items-center space-y-8">
              {!prediction ? (
                <div className="space-y-8 w-full flex flex-col items-center">
                  <PredictionForm
                    onPredict={handlePredict}
                    isLoading={isLoading}
                  />
                </div>
              ) : (
                <div className="space-y-8 w-full">
                  {/* Main Prediction Result */}
                  <div className="flex justify-center">
                    <PredictionResult prediction={prediction} inputData={inputData!} />
                  </div>

                  {/* Charts and Visualizations */}
                  <PredictionCharts
                    prediction={prediction}
                    inputData={inputData!}
                  />

                  {/* Anomaly Detection */}
                  <AnomalyDetection
                    prediction={prediction}
                    inputData={inputData!}
                  />

                  {/* Recommendations */}
                  <RecommendationEngine
                    prediction={prediction}
                    inputData={inputData!}
                    weatherData={null}
                  />

                  {/* Reset Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={resetPrediction}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      ← Make Another Prediction
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Chatbot Section - Always Visible */}
            <div className="flex flex-col items-center border-t border-gray-200 pt-12">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 Agricultural AI Assistant</h2>
                  <p className="text-gray-600">Ask questions about farming, crops, or get advice based on your predictions</p>
                </div>
                <FarmerChatbot />
              </div>
            </div>
          </div>
        ) : (
          /* History Tab */
          <div className="max-w-6xl mx-auto">
            <PredictionHistory
              currentPrediction={
                prediction && inputData
                  ? { inputData, prediction, location: null }
                  : undefined
              }
              onViewPrediction={handleViewHistory}
            />
          </div>
        )}

        {/* Information Section */}
        {!prediction && (
          <div className="mt-16 text-center max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Input Parameters</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Year:</strong> Growing season year for temporal analysis</li>
                  <li>• <strong>Rainfall:</strong> Average annual precipitation in mm</li>
                  <li>• <strong>Temperature:</strong> Average growing season temperature in °C</li>
                  <li>• <strong>Pesticides:</strong> Amount of pesticides used in tonnes</li>
                  <li>• <strong>Area:</strong> Cultivated area in hectares</li>
                  <li>• <strong>Crop Type:</strong> Specific crop variety being grown</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Prediction Output</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• <strong>Yield Estimate:</strong> Predicted yield per hectare</li>
                  <li>• <strong>Total Production:</strong> Estimated total harvest</li>
                  <li>• <strong>Confidence Score:</strong> Model confidence percentage</li>
                  <li>• <strong>Factor Analysis:</strong> Impact of key variables</li>
                  <li>• <strong>Risk Assessment:</strong> Environmental factor evaluation</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;