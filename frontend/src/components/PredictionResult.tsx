import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Leaf, MapPin } from "lucide-react";

interface PredictionResultProps {
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
    item: string;
    country: string;
    year: string;
  };
}

export const PredictionResult = ({ prediction, inputData }: PredictionResultProps) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-primary text-primary-foreground";
    if (confidence >= 60) return "bg-accent text-accent-foreground";
    return "bg-secondary text-secondary-foreground";
  };

  const getFactorIcon = (factor: string) => {
    switch (factor) {
      case "rainfall":
        return "💧";
      case "temperature":
        return "🌡️";
      case "pesticides":
        return "🧪";
      default:
        return "📊";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <TrendingUp className="h-6 w-6 text-primary" />
          Yield Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Prediction */}
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-primary">
            {prediction.yield.toLocaleString()}
          </div>
          <div className="text-lg text-muted-foreground">
            {prediction.unit} per hectare
          </div>
          <Badge className={getConfidenceColor(prediction.confidence)}>
            {prediction.confidence}% Confidence
          </Badge>
        </div>

        {/* Crop Information */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-semibold">Crop Details</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Crop:</span>
              <span className="ml-2 font-medium">{inputData.item}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Year:</span>
              <span className="ml-2 font-medium">{inputData.year}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Country:
              </span>
              <span className="ml-2 font-medium">{inputData.country}</span>
            </div>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Key Contributing Factors</h3>
          <div className="grid gap-3">
            {Object.entries(prediction.factors).map(([factor, impact]) => (
              <div key={factor} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getFactorIcon(factor)}</span>
                  <span className="font-medium capitalize">{factor}</span>
                </div>
                <Badge variant={impact === "Positive" ? "default" : impact === "Negative" ? "destructive" : "secondary"}>
                  {impact} Impact
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Prediction Details */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground">Prediction Details</div>
            <div className="text-lg font-semibold text-primary">
              {inputData.item} in {inputData.country}
            </div>
            <div className="text-sm text-muted-foreground">
              Year: {inputData.year}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};