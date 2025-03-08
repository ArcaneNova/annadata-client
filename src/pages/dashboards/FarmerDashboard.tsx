import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cropPrices } from "@/data/mockData";
import { BarChart as BarGraph, LineChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { Leaf, TrendingUp, Users, ShoppingCart, ArrowUpRight, ArrowDownRight, Plus, Edit, Trash2, Activity, HeartPulse, Thermometer, Sprout, ExternalLink, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import StatusCard from "@/components/consumer/StatusCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { logout } from "@/utils/auth";
import { Product, productService } from "@/services/product.service";

const salesData = [
  { month: "Jan", sales: 32500 },
  { month: "Feb", sales: 37800 },
  { month: "Mar", sales: 42500 },
  { month: "Apr", sales: 39200 },
  { month: "May", sales: 43800 },
  { month: "Jun", sales: 45500 },
];

// Mock crop health data (in a real app, this would come from an API)
const cropHealthData = {
  overallScore: 86,
  soilHealth: 78,
  waterEfficiency: 92,
  pestRisk: 12,
};

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryView, setInventoryView] = useState("grid");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await productService.getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      // Error is handled by the service
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(product => product._id !== id));
      toast({
        title: "Product Deleted",
        description: "The product has been removed from your inventory.",
      });
    } catch (error) {
      // Error is handled by the service
    }
  };

  const handleNavigateToCropHealth = () => {
    navigate("/agriculture/crop-health");
  };

  return (
    <ProtectedRoute allowedRoles={["farmer"]}>
      <div className="p-6 lg:p-8 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Farmer Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
        
        {/* Status Cards Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatusCard 
            title="Total Sales"
            value="₹42,500"
            description="+12.5% from last month"
            icon={TrendingUp}
            iconColor="text-green-600"
            bgGradient="bg-gradient-to-br from-green-50 to-green-100"
          />
          
          <StatusCard 
            title="Active Buyers"
            value="24"
            description="+4 new this week"
            icon={Users}
            iconColor="text-blue-600"
            bgGradient="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          
          <StatusCard 
            title="Crop Health"
            value="Excellent"
            description="98% healthy crops"
            icon={Leaf}
            iconColor="text-purple-600"
            bgGradient="bg-gradient-to-br from-purple-50 to-purple-100"
            linkTo="/agriculture/crop-health"
          />

          <StatusCard 
            title="Manage Crop Health"
            value="View Details"
            description="Monitor soil, water & pests"
            icon={Sprout}
            iconColor="text-emerald-600"
            bgGradient="bg-gradient-to-br from-emerald-50 to-emerald-100"
            linkTo="/agriculture/crop-health"
          />
        </div>

        {/* Crop Health Index Card */}
        <div className="mb-6">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-green-600" /> 
                    Crop Health Index
                  </CardTitle>
                  <CardDescription>
                    Real-time monitoring of your crop's overall health and vitality
                  </CardDescription>
                </div>
                <Link to="/agriculture/crop-health">
                  <Button variant="outline" className="gap-2 text-green-700 border-green-200 hover:bg-green-50">
                    <ExternalLink className="h-4 w-4" />
                    View Detailed Analysis
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="relative h-32 w-32 flex items-center justify-center mb-3">
                    <div className="absolute inset-0 rounded-full border-8 border-green-200"></div>
                    <div 
                      className="absolute inset-0 rounded-full border-8 border-green-500" 
                      style={{ 
                        clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                        clip: `rect(0px, ${32 * 2}px, ${32 * 2}px, 0px)`
                      }}
                    ></div>
                    <div className="text-center">
                      <span className="text-4xl font-bold text-green-700">{cropHealthData.overallScore}</span>
                      <span className="block text-xs text-green-600">out of 100</span>
                    </div>
                  </div>
                  <span className="font-semibold text-green-700">Overall Health</span>
                  <span className="text-xs text-green-600">
                    {cropHealthData.overallScore >= 80 ? 'Excellent' : 
                     cropHealthData.overallScore >= 60 ? 'Good' : 
                     cropHealthData.overallScore >= 40 ? 'Average' : 'Needs Attention'}
                  </span>
                </div>
                
                <div className="flex flex-col p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-700">Soil Health</span>
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold mb-1">{cropHealthData.soilHealth}</div>
                  <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${cropHealthData.soilHealth}%` }}></div>
                  </div>
                  <p className="text-xs text-blue-600">NPK levels and pH balance</p>
                </div>
                
                <div className="flex flex-col p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-cyan-700">Water Efficiency</span>
                    <Thermometer className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="text-2xl font-bold mb-1">{cropHealthData.waterEfficiency}</div>
                  <div className="w-full bg-cyan-200 rounded-full h-2.5 mb-2">
                    <div className="bg-cyan-600 h-2.5 rounded-full" style={{ width: `${cropHealthData.waterEfficiency}%` }}></div>
                  </div>
                  <p className="text-xs text-cyan-600">Irrigation and moisture levels</p>
                </div>
                
                <div className="flex flex-col p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-amber-700">Pest Risk</span>
                    <HeartPulse className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold mb-1">{cropHealthData.pestRisk}%</div>
                  <div className="w-full bg-amber-200 rounded-full h-2.5 mb-2">
                    <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: `${cropHealthData.pestRisk}%` }}></div>
                  </div>
                  <p className="text-xs text-amber-600">Current pest and disease risk</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Link to="/agriculture/crop-health">
                  <Button className="bg-[#138808] hover:bg-[#138808]/90 shadow-sm hover:shadow-md transition-all">
                    View Detailed Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>Monthly revenue analysis</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#888" tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                        border: 'none' 
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#8884d8" 
                      name="Sales (₹)"
                      strokeWidth={2}
                      dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="border-b bg-gray-50">
              <CardTitle>Market Prices</CardTitle>
              <CardDescription>Current market rates for various crops</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarGraph data={cropPrices}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                        border: 'none' 
                      }} 
                    />
                    <Legend />
                    <Bar 
                      dataKey="price" 
                      fill="#8884d8" 
                      name="Price (₹/kg)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarGraph>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="border-b bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>Manage your products and inventory</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setInventoryView("grid")}>
                  Grid
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInventoryView("table")}>
                  Table
                </Button>
                <Link to="/farmer/products">
                  <Button className="bg-[#138808] hover:bg-[#138808]/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : inventoryView === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="p-4 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{product.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Quantity</p>
                        <p className="font-medium">{product.stock} {product.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Price/{product.unit}</p>
                        <p className="font-medium">₹{product.price}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Link to={`/farmer/products/${product._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.stock} {product.unit}</TableCell>
                        <TableCell>₹{product.price}/{product.unit}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/farmer/products/${product._id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
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
      </div>
    </ProtectedRoute>
  );
};

export default FarmerDashboard;
