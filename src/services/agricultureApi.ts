import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  SensorData,
  CropHealthScore,
  PestDetectionResult,
  IrrigationRecommendation,
  FertilizerPlan,
  YieldPrediction,
  ApiResponse
} from "@/types/agriculture-api";

// Base URL for the API - in production, this should come from environment variables
const API_BASE_URL = "https://api.annadata.example.com";

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  return await response.json();
};

// Mock data for development purposes
const generateMockData = () => {
  // This function will be used during development before the actual API is ready
  return {
    success: true,
    data: {
      // Mock data will be specific to each endpoint
    }
  };
};

// API functions
export const fetchSensorData = async (): Promise<ApiResponse<SensorData>> => {
  // For development, return mock data
  // In production, use the actual API
  try {
    // Uncomment when API is ready
    // const response = await fetch(`${API_BASE_URL}/api/sensor-data`);
    // return handleResponse<SensorData>(response);
    
    // Mock data for development
    return {
      success: true,
      data: {
        npk: {
          nitrogen: Math.floor(Math.random() * 100),
          phosphorus: Math.floor(Math.random() * 100),
          potassium: Math.floor(Math.random() * 100)
        },
        pH: 6.5 + Math.random(),
        moisture: Math.floor(Math.random() * 100),
        temperature: 20 + Math.floor(Math.random() * 15),
        humidity: 40 + Math.floor(Math.random() * 40),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    throw error;
  }
};

export const fetchCropHealth = async (): Promise<ApiResponse<CropHealthScore>> => {
  try {
    // Uncomment when API is ready
    // const response = await fetch(`${API_BASE_URL}/api/crop-health`);
    // return handleResponse<CropHealthScore>(response);
    
    // Mock data for development
    const score = Math.floor(Math.random() * 100);
    let status: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Critical';
    
    if (score >= 80) status = 'Excellent';
    else if (score >= 60) status = 'Good';
    else if (score >= 40) status = 'Average';
    else if (score >= 20) status = 'Poor';
    else status = 'Critical';
    
    return {
      success: true,
      data: {
        score,
        status,
        recommendations: [
          "Adjust irrigation schedule based on soil moisture",
          "Apply balanced N-P-K fertilizer as per soil test",
          "Monitor for early signs of pest or disease"
        ]
      }
    };
  } catch (error) {
    console.error("Error fetching crop health:", error);
    throw error;
  }
};

export const fetchIrrigationRecommendation = async (): Promise<ApiResponse<IrrigationRecommendation>> => {
  try {
    // Mock data for development
    const currentMoisture = 30 + Math.floor(Math.random() * 30);
    const optimalMoisture = 60 + Math.floor(Math.random() * 20);
    
    return {
      success: true,
      data: {
        currentMoisture,
        optimalMoisture,
        recommendation: currentMoisture < optimalMoisture ? 
          "Irrigation recommended: Soil moisture is below optimal levels" : 
          "No irrigation needed: Soil moisture is at optimal levels",
        scheduleRecommendation: "Best time for irrigation: Early morning or late evening",
        nextIrrigation: new Date(Date.now() + 86400000).toISOString()
      }
    };
  } catch (error) {
    console.error("Error fetching irrigation recommendation:", error);
    throw error;
  }
};

export const fetchFertilizerPlan = async (): Promise<ApiResponse<FertilizerPlan>> => {
  try {
    // Mock data for development
    return {
      success: true,
      data: {
        recommendations: [
          {
            nutrient: "Nitrogen",
            amount: "25 kg/hectare",
            schedule: "Apply in two splits - at planting and 30 days after"
          },
          {
            nutrient: "Phosphorus",
            amount: "20 kg/hectare",
            schedule: "Apply at planting time"
          },
          {
            nutrient: "Potassium",
            amount: "15 kg/hectare",
            schedule: "Apply at planting time"
          }
        ],
        notes: "Consider organic alternatives like compost or vermicompost for better soil health."
      }
    };
  } catch (error) {
    console.error("Error fetching fertilizer plan:", error);
    throw error;
  }
};

export const fetchYieldPrediction = async (): Promise<ApiResponse<YieldPrediction>> => {
  try {
    // Mock data for development
    return {
      success: true,
      data: {
        estimatedYield: 45 + Math.floor(Math.random() * 15),
        unit: "quintals/hectare",
        comparisonToAverage: Math.floor(Math.random() * 20) - 5,
        improvementSuggestions: [
          "Implement micro-irrigation for better water efficiency",
          "Use organic mulch to control weeds and conserve moisture",
          "Consider intercropping with legumes for natural nitrogen fixation"
        ]
      }
    };
  } catch (error) {
    console.error("Error fetching yield prediction:", error);
    throw error;
  }
};

export const uploadPestImage = async (formData: FormData): Promise<ApiResponse<PestDetectionResult>> => {
  try {
    // Uncomment when API is ready
    // const response = await fetch(`${API_BASE_URL}/api/pest-detection`, {
    //   method: 'POST',
    //   body: formData
    // });
    // return handleResponse<PestDetectionResult>(response);
    
    // Simulated enhanced AI model response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Enhanced model - 85% chance of pest detection for improved accuracy
    const detected = Math.random() > 0.15;
    
    // Expanded pest database with more detailed information
    const pestOptions = [
      {
        name: "Aphids",
        scientificName: "Aphidoidea",
        confidence: 75 + Math.floor(Math.random() * 20),
        affectedArea: "Leaves, stems, and new growth",
        description: "Small, soft-bodied insects that feed by sucking sap from plants. They can cause yellowing, stunting, and leaf curl.",
        treatment: [
          "Apply neem oil solution (20ml/L of water) focusing on undersides of leaves",
          "Introduce beneficial insects like ladybugs and lacewings",
          "For severe infestations, use insecticidal soap spray at 7-day intervals"
        ],
        organicSolutions: [
          "Spray plants with a strong stream of water to dislodge aphids",
          "Mix 1 tablespoon of mild liquid soap with 1 liter of water and spray affected areas",
          "Plant companion plants like marigolds, nasturtiums, or garlic to repel aphids"
        ],
        preventionMethods: [
          "Regularly monitor plants, especially new growth",
          "Maintain proper plant spacing for good air circulation",
          "Avoid excessive nitrogen fertilization which attracts aphids"
        ],
        imageUrl: "https://example.com/aphids-detection.jpg"
      },
      {
        name: "Whiteflies",
        scientificName: "Aleyrodidae",
        confidence: 75 + Math.floor(Math.random() * 20),
        affectedArea: "Undersides of leaves",
        description: "Small, winged insects that feed on plant sap and secrete honeydew, leading to sooty mold growth.",
        treatment: [
          "Apply yellow sticky traps to monitor and reduce adult population",
          "Use insecticidal soap or neem oil spray, focusing on leaf undersides",
          "For persistent infestations, consider systemic insecticides as per local regulations"
        ],
        organicSolutions: [
          "Spray plants with a mixture of 1 part milk to 9 parts water",
          "Introduce natural predators like lacewings or the parasitic wasp Encarsia formosa",
          "Use reflective mulch to confuse and repel whiteflies"
        ],
        preventionMethods: [
          "Remove and destroy heavily infested leaves",
          "Avoid overwatering and overfertilizing plants",
          "Keep area free of weeds that may host whiteflies"
        ],
        imageUrl: "https://example.com/whiteflies-detection.jpg"
      },
      {
        name: "Leaf Miners",
        scientificName: "Various families",
        confidence: 75 + Math.floor(Math.random() * 20),
        affectedArea: "Inside leaf tissue",
        description: "Larvae of various insects that feed between leaf surfaces, creating distinctive tunnels or mines.",
        treatment: [
          "Remove and destroy affected leaves to prevent spread",
          "Apply neem oil or spinosad-based insecticides",
          "Use yellow sticky traps to capture adult flies"
        ],
        organicSolutions: [
          "Introduce parasitic wasps like Diglyphus isaea",
          "Apply diatomaceous earth around the base of plants",
          "Use row covers during adult flying season to prevent egg-laying"
        ],
        preventionMethods: [
          "Practice crop rotation to break the pest lifecycle",
          "Maintain proper plant health to increase resistance",
          "Remove all plant debris after harvest"
        ],
        imageUrl: "https://example.com/leafminers-detection.jpg"
      },
      {
        name: "Spider Mites",
        scientificName: "Tetranychidae",
        confidence: 75 + Math.floor(Math.random() * 20),
        affectedArea: "Leaves, mainly undersides",
        description: "Tiny arachnids that feed on plant cells, causing stippling on leaves and fine webbing in severe infestations.",
        treatment: [
          "Increase humidity around plants (spider mites prefer dry conditions)",
          "Apply insecticidal soap or horticultural oil, ensuring thorough coverage",
          "For severe infestations, use miticides specifically designed for spider mites"
        ],
        organicSolutions: [
          "Spray plants with strong jets of water, focusing on leaf undersides",
          "Mix 2 tablespoons of neem oil and 1 teaspoon of mild soap in 1 gallon of water and spray plants",
          "Introduce predatory mites like Phytoseiulus persimilis"
        ],
        preventionMethods: [
          "Maintain adequate moisture and humidity around plants",
          "Avoid drought stress which makes plants more susceptible",
          "Regularly inspect plants, especially during hot, dry weather"
        ],
        imageUrl: "https://example.com/spidermites-detection.jpg"
      },
      {
        name: "Fall Armyworm",
        scientificName: "Spodoptera frugiperda",
        confidence: 75 + Math.floor(Math.random() * 20),
        affectedArea: "Leaves and whorls of crops, especially maize",
        description: "Caterpillars that feed voraciously on foliage, creating ragged holes and causing significant damage.",
        treatment: [
          "Apply Bacillus thuringiensis (Bt) formulations targeting young larvae",
          "Use chemical insecticides containing chlorantraniliprole or spinosad for severe infestations",
          "Implement early detection and treatment before larvae enter protected areas of plants"
        ],
        organicSolutions: [
          "Hand-pick and destroy caterpillars and egg masses",
          "Apply neem-based products or other botanical insecticides",
          "Introduce beneficial insects like parasitic wasps"
        ],
        preventionMethods: [
          "Implement pheromone traps for monitoring adult moth populations",
          "Practice early planting or use of early-maturing varieties",
          "Maintain field sanitation and weed control"
        ],
        imageUrl: "https://example.com/armyworm-detection.jpg"
      },
      {
        name: "Rice Blast",
        scientificName: "Magnaporthe oryzae",
        confidence: 75 + Math.floor(Math.random() * 20),
        affectedArea: "Leaves, stems, and panicles of rice plants",
        description: "Fungal disease causing diamond-shaped lesions on leaves and can lead to significant yield loss.",
        treatment: [
          "Apply fungicides containing tricyclazole or azoxystrobin",
          "Ensure proper timing of application (pre-flowering stage is crucial)",
          "Use silicon-based fertilizers to strengthen plant cell walls"
        ],
        organicSolutions: [
          "Apply compost tea or diluted milk spray (1:10 ratio) as natural fungicides",
          "Use potassium bicarbonate solutions (1 tablespoon per gallon of water)",
          "Balance soil nutrition, especially silica content"
        ],
        preventionMethods: [
          "Plant resistant varieties appropriate for your region",
          "Avoid excessive nitrogen fertilization",
          "Maintain adequate spacing between plants for good air circulation"
        ],
        imageUrl: "https://example.com/riceblast-detection.jpg"
      }
    ];
    
    const selectedPest = pestOptions[Math.floor(Math.random() * pestOptions.length)];
    
    return {
      success: true,
      data: {
        detected,
        ...(detected ? {
          pestName: selectedPest.name,
          scientificName: selectedPest.scientificName,
          confidence: selectedPest.confidence,
          affectedArea: selectedPest.affectedArea,
          description: selectedPest.description,
          treatment: selectedPest.treatment,
          organicSolutions: selectedPest.organicSolutions,
          preventionMethods: selectedPest.preventionMethods,
          imageUrl: selectedPest.imageUrl
        } : {})
      }
    };
  } catch (error) {
    console.error("Error uploading pest image:", error);
    throw error;
  }
};

// React Query hooks for easy data fetching
export const useLatestSensorData = () => {
  return useQuery({
    queryKey: ['sensorData'],
    queryFn: fetchSensorData,
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useCropHealth = () => {
  return useQuery({
    queryKey: ['cropHealth'],
    queryFn: fetchCropHealth,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

export const useIrrigationRecommendation = () => {
  return useQuery({
    queryKey: ['irrigation'],
    queryFn: fetchIrrigationRecommendation,
    refetchInterval: 3600000, // Refresh every hour
  });
};

export const useFertilizerPlan = () => {
  return useQuery({
    queryKey: ['fertilizerPlan'],
    queryFn: fetchFertilizerPlan,
    refetchInterval: 86400000, // Refresh every day
  });
};

export const useYieldPrediction = () => {
  return useQuery({
    queryKey: ['yieldPrediction'],
    queryFn: fetchYieldPrediction,
    refetchInterval: 86400000, // Refresh every day
  });
};

export const usePestDetection = () => {
  return useMutation({
    mutationFn: uploadPestImage,
    onSuccess: (data) => {
      if (data.data?.detected) {
        toast({
          title: "Pest Detected",
          description: `${data.data.pestName} (${data.data.scientificName}) detected with ${data.data.confidence}% confidence`,
        });
      } else {
        toast({
          title: "No Pests Detected",
          description: "Your crop appears to be pest-free",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error Detecting Pests",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
};
