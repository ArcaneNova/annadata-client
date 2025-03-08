import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MapPin, Users, Bell, ShoppingCart, BarChart2, Package } from "lucide-react";
import { socketService } from "@/services/socket.service";
import NearbyConsumersMap from "@/components/vendor/NearbyConsumersMap";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import axios from "@/lib/axios";

interface Consumer {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  distance: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  images: { url: string }[];
}

const VendorDashboard = () => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [nearbyConsumers, setNearbyConsumers] = useState<Consumer[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  // Fetch vendor's own products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products/vendor/own');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive",
        });
      }
    };
    fetchProducts();
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handle location broadcasting
  useEffect(() => {
    if (isLocationEnabled && currentLocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          socketService.emit('vendor:location:update', {
            coordinates: [newLocation.lng, newLocation.lat]
          });
        },
        (error) => {
          console.error('Location watch error:', error);
          toast({
            title: "Location Error",
            description: "Failed to update location",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [isLocationEnabled, currentLocation]);

  // Listen for consumer location updates
  useEffect(() => {
    socketService.onConsumerLocationUpdate((data) => {
      setNearbyConsumers(prev => {
        const exists = prev.some(c => c._id === data.consumerId);
        if (!exists) {
          return [...prev, {
            _id: data.consumerId,
            name: "Consumer",
            location: {
              coordinates: data.location
            },
            distance: 0
          }];
        }
        return prev.map(consumer => 
          consumer._id === data.consumerId 
            ? { ...consumer, location: { coordinates: data.location } }
            : consumer
        );
      });
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  const handleLocationToggle = () => {
    if (!isLocationEnabled) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setCurrentLocation(newLocation);
            setIsLocationEnabled(true);
            toast({
              title: "Location Enabled",
              description: "Your location is now being shared with nearby consumers.",
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            toast({
              title: "Location Error",
              description: "Please enable location services to share your location.",
              variant: "destructive",
            });
          }
        );
      } else {
        toast({
          title: "Location Not Supported",
          description: "Your browser does not support location services.",
          variant: "destructive",
        });
      }
    } else {
      setIsLocationEnabled(false);
      toast({
        title: "Location Disabled",
        description: "Your location is no longer being shared.",
      });
    }
  };

  const onAddProduct = async (data: any) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'images') {
          Array.from(data.images).forEach((file: any) => {
            formData.append('images', file);
          });
        } else {
          formData.append(key, data[key]);
        }
      });
      formData.append('sellerType', 'vendor');

      const response = await axios.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProducts(prev => [...prev, response.data]);
      setIsAddProductOpen(false);
      reset();
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your products and track nearby consumers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#138808]" />
              Location Settings
            </CardTitle>
            <CardDescription>
              Control your location sharing preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="location-sharing">
                Share location with consumers
              </Label>
              <Switch
                id="location-sharing"
                checked={isLocationEnabled}
                onCheckedChange={handleLocationToggle}
              />
            </div>
            {isLocationEnabled && (
              <p className="mt-2 text-sm text-green-600">
                Your location is being shared with nearby consumers
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#FF9933]" />
              Products
            </CardTitle>
            <CardDescription>
              {products.length} products in your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => setIsAddProductOpen(true)} className="w-full">
                Add New Product
              </Button>
              <Link to="/vendor/products" className="block">
                <Button variant="outline" className="w-full">
                  Manage Products
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-[#000080]" />
              Analytics
            </CardTitle>
            <CardDescription>
              Track your business performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/vendor/analytics">
              <Button className="w-full">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Map showing nearby consumers */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Nearby Consumers</CardTitle>
            <CardDescription>
              View consumers in your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NearbyConsumersMap 
              consumers={nearbyConsumers} 
              vendorLocation={currentLocation ? [currentLocation.lng, currentLocation.lat] : undefined}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your inventory
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddProduct)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register('description')} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select {...register('category')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input type="number" id="price" {...register('price')} required min="0" step="0.01" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input type="number" id="stock" {...register('stock')} required min="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Select {...register('unit')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="gram">Gram</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="packet">Packet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="images">Images</Label>
                <Input type="file" id="images" {...register('images')} multiple accept="image/*" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorDashboard; 