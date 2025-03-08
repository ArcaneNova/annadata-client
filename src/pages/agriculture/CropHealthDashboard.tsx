import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  BarChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Droplet, 
  Thermometer, 
  Leaf, 
  Wind, 
  Combine, 
  Calendar, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { 
  useLatestSensorData, 
  useCropHealth, 
  useIrrigationRecommendation, 
  useFertilizerPlan, 
  useYieldPrediction,
  usePestDetection
} from "@/services/agricultureApi";

const getCropHealthColor = (score: number) => {
  if (score >= 80) return "#4CAF50"; // Green
  if (score >= 60) return "#8BC34A"; // Light Green
  if (score >= 40) return "#FFC107"; // Amber
  if (score >= 20) return "#FF9800"; // Orange
  return "#F44336"; // Red
};

const getMoistureColor = (moisture: number, optimal: number) => {
  const diff = Math.abs(moisture - optimal);
  const percentage = diff / optimal;
  
  if (percentage <= 0.1) return "#4CAF50"; // Green - within 10%
  if (percentage <= 0.2) return "#8BC34A"; // Light Green - within 20%
  if (percentage <= 0.3) return "#FFC107"; // Amber - within 30%
  if (percentage <= 0.4) return "#FF9800"; // Orange - within 40%
  return "#F44336"; // Red - more than 40% off
};

const LoadingCard = () => (
  <div className="flex justify-center items-center h-full min-h-[200px]">
    <RefreshCw className="animate-spin text-primary h-8 w-8" />
  </div>
);

const ErrorCard = ({ message }: { message: string }) => (
  <div className="flex flex-col justify-center items-center h-full min-h-[200px] text-destructive">
    <AlertCircle className="h-10 w-10 mb-3" />
    <p className="text-sm">{message}</p>
  </div>
);

const CropHealthDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: sensorData, isLoading: isLoadingSensor, error: sensorError } = useLatestSensorData();
  const { data: healthData, isLoading: isLoadingHealth, error: healthError } = useCropHealth();
  const { data: irrigationData, isLoading: isLoadingIrrigation, error: irrigationError } = useIrrigationRecommendation();
  const { data: fertilizerData, isLoading: isLoadingFertilizer, error: fertilizerError } = useFertilizerPlan();
  const { data: yieldData, isLoading: isLoadingYield, error: yieldError } = useYieldPrediction();
  const pestDetection = usePestDetection();
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('image', files[0]);
      pestDetection.mutate(formData);
    }
  };
  
  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const npkData = [
    {
      name: 'Nitrogen',
      value: sensorData?.data?.npk.nitrogen || 0,
      color: '#FF9933', // Orange from Indian flag
    },
    {
      name: 'Phosphorus',
      value: sensorData?.data?.npk.phosphorus || 0,
      color: '#FFFFFF', // White from Indian flag
    },
    {
      name: 'Potassium',
      value: sensorData?.data?.npk.potassium || 0,
      color: '#138808', // Green from Indian flag
    },
  ];
  
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link 
                to="/dashboard/farmer" 
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Farmer Dashboard</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Crop Health Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Real-time insights and recommendations for optimal crop management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard/farmer">
              <Button variant="outline" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Farmer Dashboard
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Last updated: {sensorData?.data?.timestamp ? new Date(sensorData.data.timestamp).toLocaleString() : 'Loading...'}
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="soil-analysis">Soil Analysis</TabsTrigger>
            <TabsTrigger value="pest-detection">Pest Detection</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <Card className="col-span-1 md:col-span-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-[#138808]" />
                    Crop Health Score
                  </CardTitle>
                  <CardDescription>
                    Overall assessment of your crop's health
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingHealth ? (
                    <LoadingCard />
                  ) : healthError ? (
                    <ErrorCard message="Failed to load crop health data" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="relative h-36 w-36 flex items-center justify-center rounded-full border-8"
                        style={{ borderColor: getCropHealthColor(healthData?.data?.score || 0) }}>
                        <span className="text-4xl font-bold">{healthData?.data?.score || 0}</span>
                        <span className="text-xs absolute bottom-3">out of 100</span>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-lg font-semibold" 
                          style={{ color: getCropHealthColor(healthData?.data?.score || 0) }}>
                          {healthData?.data?.status || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-[#FF9933]" />
                    Current Conditions
                  </CardTitle>
                  <CardDescription>
                    Live environmental readings
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingSensor ? (
                    <LoadingCard />
                  ) : sensorError ? (
                    <ErrorCard message="Failed to load sensor data" />
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplet className="h-4 w-4 text-blue-600" />
                            <p className="text-sm text-blue-600">Moisture</p>
                          </div>
                          <p className="text-2xl font-semibold">{sensorData?.data?.moisture}%</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Thermometer className="h-4 w-4 text-orange-600" />
                            <p className="text-sm text-orange-600">Temperature</p>
                          </div>
                          <p className="text-2xl font-semibold">{sensorData?.data?.temperature}°C</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="h-4 w-4 text-green-600" />
                            <p className="text-sm text-green-600">Humidity</p>
                          </div>
                          <p className="text-2xl font-semibold">{sensorData?.data?.humidity}%</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Combine className="h-4 w-4 text-purple-600" />
                            <p className="text-sm text-purple-600">pH Level</p>
                          </div>
                          <p className="text-2xl font-semibold">{sensorData?.data?.pH.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-1 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-3 border-b bg-gray-50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-600" />
                    Irrigation Status
                  </CardTitle>
                  <CardDescription>
                    Water recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingIrrigation ? (
                    <LoadingCard />
                  ) : irrigationError ? (
                    <ErrorCard message="Failed to load irrigation data" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        {irrigationData?.data?.currentMoisture < irrigationData?.data?.optimalMoisture ? (
                          <AlertTriangle className="h-8 w-8 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        )}
                        <div>
                          <h4 className="font-semibold">
                            {irrigationData?.data?.currentMoisture < irrigationData?.data?.optimalMoisture 
                              ? "Irrigation Needed" 
                              : "Adequate Moisture"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Current: {irrigationData?.data?.currentMoisture}% | 
                            Optimal: {irrigationData?.data?.optimalMoisture}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="h-3 rounded-full overflow-hidden bg-gray-200">
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${Math.min(100, (irrigationData?.data?.currentMoisture / irrigationData?.data?.optimalMoisture) * 100)}%`,
                            backgroundColor: getMoistureColor(
                              irrigationData?.data?.currentMoisture || 0,
                              irrigationData?.data?.optimalMoisture || 50
                            )
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm mt-4">
                        <Clock className="h-4 w-4" />
                        <span>Next irrigation: {irrigationData?.data?.nextIrrigation 
                          ? new Date(irrigationData.data.nextIrrigation).toLocaleString() 
                          : 'Not scheduled'}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    NPK Levels
                  </CardTitle>
                  <CardDescription>
                    Current soil nutrient status
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] pt-6">
                  {isLoadingSensor ? (
                    <LoadingCard />
                  ) : sensorError ? (
                    <ErrorCard message="Failed to load NPK data" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={npkData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#888" tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                            border: 'none'
                          }}
                        />
                        <Bar dataKey="value">
                          {npkData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Combine className="h-5 w-5 text-[#138808]" />
                    Yield Prediction
                  </CardTitle>
                  <CardDescription>
                    Estimated harvest outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingYield ? (
                    <LoadingCard />
                  ) : yieldError ? (
                    <ErrorCard message="Failed to load yield prediction data" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center py-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-[#138808]">
                            {yieldData?.data?.estimatedYield}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {yieldData?.data?.unit}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {yieldData?.data?.comparisonToAverage && yieldData.data.comparisonToAverage > 0 ? (
                            <div className="text-green-600 font-medium flex items-center">
                              <span className="mr-1">+{yieldData.data.comparisonToAverage}%</span> 
                              above average
                            </div>
                          ) : (
                            <div className="text-red-600 font-medium flex items-center">
                              <span className="mr-1">{yieldData?.data?.comparisonToAverage}%</span> 
                              below average
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Improvement Suggestions:</h4>
                        <ul className="space-y-1">
                          {yieldData?.data?.improvementSuggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="soil-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Soil Analysis</CardTitle>
                <CardDescription>
                  Comprehensive breakdown of soil composition and properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSensor ? (
                  <LoadingCard />
                ) : sensorError ? (
                  <ErrorCard message="Failed to load soil data" />
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">NPK Composition</h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm text-[#FF9933]">Nitrogen (N)</Label>
                              <span className="text-sm font-semibold">{sensorData?.data?.npk.nitrogen}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#FF9933]" 
                                style={{ width: `${sensorData?.data?.npk.nitrogen}%` }} 
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm text-gray-500">Phosphorus (P)</Label>
                              <span className="text-sm font-semibold">{sensorData?.data?.npk.phosphorus}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gray-500" 
                                style={{ width: `${sensorData?.data?.npk.phosphorus}%` }} 
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm text-[#138808]">Potassium (K)</Label>
                              <span className="text-sm font-semibold">{sensorData?.data?.npk.potassium}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#138808]" 
                                style={{ width: `${sensorData?.data?.npk.potassium}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Soil Properties</h3>
                        
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <div>
                            <Label className="text-sm">pH Level</Label>
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold">{sensorData?.data?.pH.toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground mb-1">
                                {sensorData?.data?.pH < 6 ? 'Acidic' : sensorData?.data?.pH > 7.5 ? 'Alkaline' : 'Neutral'}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Moisture Content</Label>
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold">{sensorData?.data?.moisture}%</span>
                              <span className="text-sm text-muted-foreground mb-1">
                                {sensorData?.data?.moisture < 30 ? 'Low' : sensorData?.data?.moisture > 60 ? 'High' : 'Optimal'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Environmental Factors</h3>
                        
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <div>
                            <Label className="text-sm">Temperature</Label>
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold">{sensorData?.data?.temperature}°C</span>
                              <span className="text-sm text-muted-foreground mb-1">
                                {sensorData?.data?.temperature < 15 ? 'Cool' : sensorData?.data?.temperature > 30 ? 'Hot' : 'Moderate'}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Humidity</Label>
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-bold">{sensorData?.data?.humidity}%</span>
                              <span className="text-sm text-muted-foreground mb-1">
                                {sensorData?.data?.humidity < 40 ? 'Low' : sensorData?.data?.humidity > 70 ? 'High' : 'Moderate'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pest-detection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Pest Detection</CardTitle>
                <CardDescription>
                  Upload an image of your crop to detect pests and diseases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="font-medium text-lg mb-2">Upload Image</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Take a clear photo of the affected plant part and upload it here
                        </p>
                        <Button 
                          onClick={handleClickUpload}
                          disabled={pestDetection.isPending}
                        >
                          {pestDetection.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Select Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Upload a close-up image of the affected area
                      </p>
                      <p className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Ensure good lighting for accurate detection
                      </p>
                      <p className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Include healthy parts for comparison
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {pestDetection.data ? (
                      <>
                        {pestDetection.data.data?.detected ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <AlertCircle className="h-6 w-6 text-red-600" />
                              <h3 className="font-semibold text-lg text-red-600">Pest Detected</h3>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">Pest Type</p>
                                  <p className="font-medium">{pestDetection.data.data.pestName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Confidence</p>
                                  <p className="font-medium">{pestDetection.data.data.confidence}%</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500">Affected Area</p>
                                <p className="font-medium">{pestDetection.data.data.affectedArea}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Recommended Treatment</p>
                                <ul className="space-y-1">
                                  {pestDetection.data.data.treatment?.map((item, index) => (
                                    <li key={index} className="text-sm flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                              <h3 className="font-semibold text-lg text-green-600">No Pests Detected</h3>
                            </div>
                            <p className="text-sm">
                              Your crop appears to be pest-free based on the uploaded image. 
                              Continue monitoring for any signs of pest or disease activity.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center h-full">
                        <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-medium text-center mb-2">No Analysis Available</h3>
                        <p className="text-sm text-center text-muted-foreground">
                          Upload an image of your crop to receive AI-powered pest and disease detection results
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Smart Irrigation Recommendations</CardTitle>
                <CardDescription>
                  Optimal watering schedules based on soil moisture and environmental factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingIrrigation ? (
                  <LoadingCard />
                ) : irrigationError ? (
                  <ErrorCard message="Failed to load irrigation recommendations" />
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Current Status</h3>
                      <p>{irrigationData?.data?.recommendation}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Irrigation Schedule</h3>
                      <p className="mb-4 text-sm">{irrigationData?.data?.scheduleRecommendation}</p>
                      
                      <div className="flex items-center gap-4 border-t pt-4">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Next Scheduled Irrigation</p>
                          <p className="text-sm text-muted-foreground">
                            {irrigationData?.data?.nextIrrigation 
                              ? new Date(irrigationData.data.nextIrrigation).toLocaleString() 
                              : 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fertilizer & Nutrient Plan</CardTitle>
                <CardDescription>
                  Recommended fertilizer applications based on soil analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFertilizer ? (
                  <LoadingCard />
                ) : fertilizerError ? (
                  <ErrorCard message="Failed to load fertilizer recommendations" />
                ) : (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nutrient</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Application Schedule</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fertilizerData?.data?.recommendations.map((rec, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{rec.nutrient}</TableCell>
                            <TableCell>{rec.amount}</TableCell>
                            <TableCell>{rec.schedule}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Notes</h3>
                      <p className="text-sm">{fertilizerData?.data?.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Crop Health Recommendations</CardTitle>
                <CardDescription>
                  Actionable insights to improve overall crop health
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHealth ? (
                  <LoadingCard />
                ) : healthError ? (
                  <ErrorCard message="Failed to load crop health recommendations" />
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {healthData?.data?.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">{rec}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CropHealthDashboard;
