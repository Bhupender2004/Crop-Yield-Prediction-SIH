import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PredictionData {
  year: string;
  rainfall: string;
  pesticides: string;
  avgTemp: string;
  country: string;
  item: string;
}

interface PredictionFormProps {
  onPredict: (data: PredictionData) => void;
  isLoading: boolean;
}

// Crops available in the trained model
const cropItems = [
  "Cassava", "Maize", "Plantains and others", "Potatoes", "Rice, paddy",
  "Sorghum", "Soybeans", "Sweet potatoes", "Wheat", "Yams"
];

// Countries available in the trained model
const countries = [
  "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Belarus", "Belgium",
  "Botswana", "Brazil", "Bulgaria", "Burkina Faso", "Burundi", "Cameroon",
  "Canada", "Central African Republic", "Chile", "Colombia", "Croatia",
  "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Eritrea",
  "Estonia", "Finland", "France", "Germany", "Ghana", "Greece", "Guatemala",
  "Guinea", "Guyana", "Haiti", "Honduras", "Hungary", "India", "Indonesia", "Iraq",
  "Ireland", "Italy", "Jamaica", "Japan", "Kazakhstan", "Kenya", "Latvia",
  "Lebanon", "Lesotho", "Libya", "Lithuania", "Madagascar", "Malawi", "Malaysia",
  "Mali", "Mauritania", "Mauritius", "Mexico", "Montenegro", "Morocco",
  "Mozambique", "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Norway", "Pakistan", "Papua New Guinea", "Peru", "Poland", "Portugal",
  "Qatar", "Romania", "Rwanda", "Saudi Arabia", "Senegal", "Slovenia",
  "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Tajikistan", "Thailand", "Tunisia", "Turkey", "Uganda",
  "Ukraine", "United Kingdom", "Uruguay", "Zambia", "Zimbabwe"
];

export const PredictionForm = ({ onPredict, isLoading }: PredictionFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PredictionData>({
    year: "",
    rainfall: "",
    pesticides: "",
    avgTemp: "",
    country: "",
    item: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.year || !formData.rainfall || !formData.pesticides ||
        !formData.avgTemp || !formData.country || !formData.item) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to get a prediction.",
        variant: "destructive"
      });
      return;
    }

    // Validate numeric inputs
    const year = parseInt(formData.year);
    const rainfall = parseFloat(formData.rainfall);
    const pesticides = parseFloat(formData.pesticides);
    const avgTemp = parseFloat(formData.avgTemp);

    if (isNaN(year) || isNaN(rainfall) || isNaN(pesticides) || isNaN(avgTemp)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers for all numeric fields.",
        variant: "destructive"
      });
      return;
    }

    if (year < 1900 || year > 2100) {
      toast({
        title: "Invalid Year",
        description: "Please enter a valid year between 1900 and 2100.",
        variant: "destructive",
        duration: 4000
      });
      return;
    }

    onPredict(formData);
  };

  const handleInputChange = (field: keyof PredictionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Crop Yield Prediction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g., 2024"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                min="1900"
                max="2100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rainfall">Average Rainfall (mm/year)</Label>
              <Input
                id="rainfall"
                type="number"
                placeholder="e.g., 1200"
                value={formData.rainfall}
                onChange={(e) => handleInputChange("rainfall", e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pesticides">Pesticides (tonnes)</Label>
              <Input
                id="pesticides"
                type="number"
                placeholder="e.g., 2.5"
                value={formData.pesticides}
                onChange={(e) => handleInputChange("pesticides", e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avgTemp">Average Temperature (°C)</Label>
              <Input
                id="avgTemp"
                type="number"
                placeholder="e.g., 25.5"
                value={formData.avgTemp}
                onChange={(e) => handleInputChange("avgTemp", e.target.value)}
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item">Crop Type</Label>
              <Select value={formData.item} onValueChange={(value) => handleInputChange("item", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a crop" />
                </SelectTrigger>
                <SelectContent>
                  {cropItems.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>



          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Predicting..." : "Predict Yield"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};