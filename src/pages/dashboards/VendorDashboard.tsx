import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { consumers } from "@/data/mockData";
import { 
  Package, MapPin, Bell, TrendingUp, ShoppingBag, Users, ArrowUpRight, 
  Plus, Edit, Trash2, Check, AlertTriangle, Loader2, ArrowUpDown, 
  ChevronLeft, ChevronRight, Star, StarHalf, Percent, X, Download, 
  BarChart2, ShoppingCart
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import NearbyVendorsMap from "@/components/vendor/NearbyVendorsMap";
import ProtectedRoute from "@/components/ProtectedRoute";
import { logout, getUser } from "@/utils/auth";
import { productService } from "@/services/product.service";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import MarginModal from "@/components/vendor/MarginModal";
import NearbyConsumersMap from "@/components/vendor/NearbyConsumersMap";
import { socketService } from "@/services/socket.service";
import { useToast } from "@/components/ui/use-toast";
import type { Product } from "@/types/product";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/axios";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const salesData = [
  { day: "Mon", sales: 2800 },
  { day: "Tue", sales: 3200 },
  { day: "Wed", sales: 3800 },
  { day: "Thu", sales: 3500 },
  { day: "Fri", sales: 4200 },
  { day: "Sat", sales: 4800 },
  { day: "Sun", sales: 4100 },
];

const productDistribution = [
  { name: "Rice", value: 35 },
  { name: "Wheat", value: 25 },
  { name: "Vegetables", value: 20 },
  { name: "Fruits", value: 20 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface FilterState {
  minPrice: string;
  maxPrice: string;
  sort: string;
  order: 'asc' | 'desc';
}

interface NearbyConsumer {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  distance: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'consumer' | 'vendor' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isConsumer: () => boolean;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  totalAmount: number;
  status: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
}

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: "",
    maxPrice: "",
    sort: "createdAt",
    order: "desc"
  });

  // Add new state for ratings analytics
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: [0, 0, 0, 0, 0] // 1 to 5 stars
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMarginModalOpen, setIsMarginModalOpen] = useState(false);
  const [nearbyConsumersCount, setNearbyConsumersCount] = useState(0);
  const [nearbyConsumers, setNearbyConsumers] = useState<NearbyConsumer[]>([]);
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [showOrderNotification, setShowOrderNotification] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // New state variables for inventory alerts
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(10);
  
  // State for export options
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);
  
  // State for order status distribution
  const [orderStatusData, setOrderStatusData] = useState([
    { status: 'Pending', count: 0, color: '#FFBB28' },
    { status: 'Confirmed', count: 0, color: '#00C49F' },
    { status: 'Delivered', count: 0, color: '#0088FE' },
    { status: 'Cancelled', count: 0, color: '#FF8042' }
  ]);
  
  // Calculate dashboard stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < alertThreshold).length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);

  useEffect(() => {
    console.log('Initializing VendorDashboard...');
    const auth = useAuth.getState();
    console.log('Authentication status:', auth.token ? 'true' : 'false');

    let mounted = true;
    let cleanup: (() => void) | null = null;
    let watchId: number | null = null;

    const initialize = async () => {
      if (!auth.token) {
        console.log('No authentication token found, skipping initialization');
        return;
      }

      try {
        // Initialize socket first
        const socket = await socketService.initialize();
        if (!socket) {
          console.log('Failed to initialize socket connection');
          return;
        }

        // Set up order notification listener
        cleanup = socketService.onNewOrder((order) => {
          if (mounted) {
            console.log('Received new order:', order);
            setNewOrders(prev => [...prev, order]);
            setOrders(prev => [order, ...prev]);
            setShowOrderNotification(true);
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(console.error);
          }
        });

        // Start location tracking after socket is ready
        watchId = await startLocationTracking();
      } catch (error) {
        console.error('Initialization error:', error);
        setLocationError('Failed to initialize vendor services');
      }
    };

    initialize();

    return () => {
      console.log('Cleaning up VendorDashboard...');
      mounted = false;
      if (cleanup) {
        cleanup();
      }
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setIsTracking(false);
      }
      socketService.disconnect();
    };
  }, []);

  // Add useEffect to fetch products
  useEffect(() => {
    console.log('Fetching products with filters:', filters);
    fetchProducts();
  }, [currentPage, itemsPerPage, filters]);

  const startLocationTracking = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return null;
    }

    try {
        setIsTracking(true);
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const location = {
            lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      setCurrentLocation(location);
      await updateVendorLocation(location);

      // Start continuous location watching
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
        const newLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };
        setCurrentLocation(newLocation);
          await updateVendorLocation(newLocation);
        },
        (error) => {
          console.error('Location tracking error:', error);
          setLocationError('Failed to track location');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      return watchId;
    } catch (error) {
      console.error('Location tracking error:', error);
      setLocationError('Failed to start location tracking');
      setIsTracking(false);
      return null;
    }
  };

  // Function to get address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || 'Address not found';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Address not found';
    }
  };

  const updateVendorLocation = async (location: { lat: number; lng: number }) => {
    try {
      const address = await getAddressFromCoordinates(location.lat, location.lng);
      
      // Check if socket is connected before emitting
      const socket = await socketService.initialize();
      if (socket) {
        console.log('Emitting vendor location update:', {
          coordinates: [location.lng, location.lat],
          address
        });
        
        socket.emit('vendor:location:update', {
          coordinates: [location.lng, location.lat],
          address
        });
      } else {
        console.log('Socket not connected, using REST API for location update');
      }

      // Also update through REST API for persistence
      await fetch(`${import.meta.env.VITE_API_URL}/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coordinates: [location.lng, location.lat],
          address
        })
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      if (!response || response.length === 0) {
        // Fallback data
        const fallbackProducts = [
          {
            _id: "1",
            name: "Organic Fertilizer",
            description: "High-quality organic fertilizer",
            price: 500,
            stock: 1000,
            unit: "kg",
            category: "fertilizers",
            images: [{ url: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d" }],
            averageRating: 4.7,
            totalRatings: 35
          },
          {
            _id: "2",
            name: "Pesticide Spray",
            description: "Eco-friendly pest control solution",
            price: 300,
            stock: 500,
            unit: "L",
            category: "pesticides",
            images: [{ url: "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae" }],
            averageRating: 4.5,
            totalRatings: 28
          }
        ];
        setProducts(fallbackProducts);
        toast({
          title: "Notice",
          description: "Using sample product data",
          variant: "default",
        });
        return;
      }
      setProducts(response);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Use same fallback data in catch block
      const fallbackProducts = [
        {
          _id: "1",
          name: "Organic Fertilizer",
          description: "High-quality organic fertilizer",
          price: 500,
          stock: 1000,
          unit: "kg",
          category: "fertilizers",
          images: [{ url: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d" }],
          averageRating: 4.7,
          totalRatings: 35
        },
        {
          _id: "2",
          name: "Pesticide Spray",
          description: "Eco-friendly pest control solution",
          price: 300,
          stock: 500,
          unit: "L",
          category: "pesticides",
          images: [{ url: "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae" }],
          averageRating: 4.5,
          totalRatings: 28
        }
      ];
      setProducts(fallbackProducts);
      toast({
        title: "Notice",
        description: "Using sample product data - Could not fetch live data",
        variant: "default",
      });
    } finally {
      setLoading(false);
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

  const checkNearbyCustomers = (location: { lat: number; lng: number }) => {
    const nearbyCustomers = consumers.filter((consumer) => {
      const distance = Math.sqrt(
        Math.pow(consumer.location.lat - location.lat, 2) +
        Math.pow(consumer.location.lng - location.lng, 2)
      );
      return distance < 0.01;
    });

    nearbyCustomers.forEach((customer) => {
      toast({
        title: "Customer Nearby!",
        description: `${customer.name} is in your area and might be interested in your products.`,
      });
    });
  };

  const lowStockCount = products.filter(item => item.stock < 20).length;
  const filteredProducts = showLowStock 
    ? products.filter(item => item.stock < 20) 
    : products;

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when limit changes
  };

  // Add function to calculate rating statistics
  const calculateRatingStats = (products: Product[]) => {
    const stats = {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: [0, 0, 0, 0, 0]
    };

    products.forEach(product => {
      if (product.averageRating && product.totalRatings) {
        stats.averageRating += product.averageRating * product.totalRatings;
        stats.totalRatings += product.totalRatings;
        
        // Calculate distribution
        const rating = Math.round(product.averageRating);
        if (rating >= 1 && rating <= 5) {
          stats.ratingDistribution[rating - 1] += product.totalRatings;
        }
      }
    });

    if (stats.totalRatings > 0) {
      stats.averageRating /= stats.totalRatings;
    }

    setRatingStats(stats);
  };

  const handleAddProduct = () => {
    navigate('/products/new');
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/products/${productId}/edit`);
  };

  const handleOrderNotificationClose = () => {
    setShowOrderNotification(false);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderNotification(false);
  };

  const handleAcceptOrder = (orderId: string) => {
    socketService.emitOrderEvent('order:accept', { orderId });
    
    // Update order status in the local state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: 'accepted' } 
          : order
      )
    );
    
    setSelectedOrder(null);
    toast({
      title: "Order Accepted",
      description: "You will be notified when the order is ready for delivery",
    });
  };

  const handleRejectOrder = (orderId: string) => {
    socketService.emitOrderEvent('order:reject', { orderId });
    
    // Update order status in the local state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: 'rejected' } 
          : order
      )
    );
    
    setSelectedOrder(null);
    toast({
      title: "Order Rejected",
      description: "The customer will be notified",
    });
  };

  // Handle Export
  const handleExport = async (type: 'orders' | 'inventory' | 'sales') => {
    try {
      setIsExporting(true);
      setExportType(type);
      
      let endpoint = '';
      let filename = '';
      
      switch (type) {
        case 'orders':
          endpoint = '/export/orders';
          filename = 'vendor_orders.csv';
          break;
        case 'inventory':
          endpoint = '/export/inventory';
          filename = 'vendor_inventory.csv';
          break;
        case 'sales':
          endpoint = '/export/sales';
          filename = 'vendor_sales_analytics.csv';
          break;
      }
      
      const response = await api.get(endpoint, { responseType: 'blob' });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} data has been exported.`,
      });
    } catch (error) {
      console.error(`Export error (${type}):`, error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${type} data. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };
  
  // Inventory Alert Functions
  const handleToggleAlerts = (enabled: boolean) => {
    setAlertsEnabled(enabled);
    // Save to backend
    saveAlertSettings(enabled, alertThreshold);
  };
  
  const handleSaveAlertSettings = () => {
    // Save to backend
    saveAlertSettings(alertsEnabled, alertThreshold);
  };
  
  const saveAlertSettings = async (enabled: boolean, threshold: number) => {
    try {
      await api.post('/inventory/alerts/settings', {
        enabled,
        threshold
      });
      
      toast({
        title: "Settings Saved",
        description: `Inventory alert settings have been updated.`,
      });
    } catch (error) {
      console.error('Save alert settings error:', error);
      toast({
        title: "Error",
        description: "Failed to save alert settings.",
        variant: "destructive",
      });
    }
  };
  
  // Fetch alert settings
  const fetchAlertSettings = async () => {
    try {
      // Attempt to fetch alert settings from the server
      const response = await api.get('/inventory/alerts/settings');
      const { enabled, threshold } = response.data;
      
      setAlertsEnabled(enabled);
      setAlertThreshold(threshold);
    } catch (error) {
      console.error('Fetch alert settings error:', error);
      // Set default values if the endpoint is not found (404) or other errors occur
      setAlertsEnabled(false);
      setAlertThreshold(10);
      
      // Don't show error toast for 404 - this is expected if the backend endpoint isn't implemented yet
      if (error.response && error.response.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load alert settings. Using defaults.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Handle margin save
  const handleMarginSave = async (productId: string, marginPercentage: number) => {
    try {
      await api.patch(`/products/${productId}/margin`, { marginPercentage });
      
      toast({
        title: "Margin Updated",
        description: "Product margin has been updated successfully.",
      });
      
      fetchProducts();
      setIsMarginModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Update margin error:', error);
      toast({
        title: "Error",
        description: "Failed to update product margin.",
        variant: "destructive",
      });
    }
  };
  
  // Add useEffect to fetch alert settings
  useEffect(() => {
    fetchAlertSettings();
  }, []);

  // Add fetchOrders function to load vendor orders
  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/vendor');
      if (!response || response.length === 0) {
        // Fallback data
        const fallbackOrders = [
          {
            _id: "1",
            orderNumber: "ORD001",
            buyer: "farmer123",
            seller: "vendor123",
            items: [
              {
                product: {
                  _id: "p1",
                  name: "Organic Fertilizer",
                  price: 500
                },
                quantity: 10,
                price: 500,
                unit: "kg"
              }
            ],
            totalAmount: 5000,
            status: "pending",
            paymentStatus: "pending",
            paymentMethod: "razorpay",
            deliveryAddress: {
              street: "123 Farm Road",
              city: "Rural City",
              state: "Maharashtra",
              pincode: "400001"
            },
            orderType: "farmer-to-vendor",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            _id: "2",
            orderNumber: "ORD002",
            buyer: "farmer456",
            seller: "vendor123",
            items: [
              {
                product: {
                  _id: "p2",
                  name: "Pesticide Spray",
                  price: 300
                },
                quantity: 5,
                price: 300,
                unit: "L"
              }
            ],
            totalAmount: 1500,
            status: "in-transit",
            paymentStatus: "completed",
            paymentMethod: "razorpay",
            deliveryAddress: {
              street: "456 Agriculture Lane",
              city: "Farming Town",
              state: "Punjab",
              pincode: "140001"
            },
            orderType: "farmer-to-vendor",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setOrders(fallbackOrders);
        toast({
          title: "Notice",
          description: "Using sample order data",
          variant: "default",
        });
        return;
      }
      setOrders(response);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Use same fallback data in catch block
      const fallbackOrders = [
        {
          _id: "1",
          orderNumber: "ORD001",
          buyer: "farmer123",
          seller: "vendor123",
          items: [
            {
              product: {
                _id: "p1",
                name: "Organic Fertilizer",
                price: 500
              },
              quantity: 10,
              price: 500,
              unit: "kg"
            }
          ],
          totalAmount: 5000,
          status: "pending",
          paymentStatus: "pending",
          paymentMethod: "razorpay",
          deliveryAddress: {
            street: "123 Farm Road",
            city: "Rural City",
            state: "Maharashtra",
            pincode: "400001"
          },
          orderType: "farmer-to-vendor",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "2",
          orderNumber: "ORD002",
          buyer: "farmer456",
          seller: "vendor123",
          items: [
            {
              product: {
                _id: "p2",
                name: "Pesticide Spray",
                price: 300
              },
              quantity: 5,
              price: 300,
              unit: "L"
            }
          ],
          totalAmount: 1500,
          status: "in-transit",
          paymentStatus: "completed",
          paymentMethod: "razorpay",
          deliveryAddress: {
            street: "456 Agriculture Lane",
            city: "Farming Town",
            state: "Punjab",
            pincode: "140001"
          },
          orderType: "farmer-to-vendor",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setOrders(fallbackOrders);
      toast({
        title: "Notice",
        description: "Using sample order data - Could not fetch live data",
        variant: "default",
      });
    }
  };

  // Calculate order status distribution whenever orders change
  useEffect(() => {
    if (orders.length > 0) {
      // Initialize counts
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        delivered: 0,
        cancelled: 0
      };
      
      // Count orders by status
      orders.forEach(order => {
        const status = order.status.toLowerCase();
        if (status in statusCounts) {
          statusCounts[status as keyof typeof statusCounts]++;
        }
      });
      
      // Update state
      setOrderStatusData([
        { status: 'Pending', count: statusCounts.pending, color: '#FFBB28' },
        { status: 'Confirmed', count: statusCounts.confirmed, color: '#00C49F' },
        { status: 'Delivered', count: statusCounts.delivered, color: '#0088FE' },
        { status: 'Cancelled', count: statusCounts.cancelled, color: '#FF8042' }
      ]);
    }
  }, [orders]);

  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const renderOrderDialog = () => {
    return (
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Order details and delivery information
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.product._id}
                      className="flex justify-between text-sm"
                    >
                      <span>{item.product.name} x {item.quantity}</span>
                      <span>₹{item.product.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-medium">
                    <div className="flex justify-between">
                      <span>Total Amount</span>
                      <span>₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Delivery Address</h3>
                <p className="text-sm">
                  {selectedOrder.deliveryAddress.street}<br />
                  {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}<br />
                  {selectedOrder.deliveryAddress.pincode}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => selectedOrder && handleAcceptOrder(selectedOrder._id)}
                >
                  Accept Order
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => selectedOrder && handleRejectOrder(selectedOrder._id)}
                >
                  Reject Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };
  
  const renderMarginModal = () => {
    return (
      <MarginModal 
        isOpen={isMarginModalOpen} 
        onClose={() => {
          setIsMarginModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onUpdate={fetchProducts}
      />
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your store, inventory, and orders
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
            <Button onClick={handleAddProduct}>
              Add New Product
            </Button>
          </div>
        </div>

        {locationError && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-center gap-2 py-3 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <p>{locationError}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          {/* Navigation Cards for Vendor Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <Link to="/vendor/dashboard">
              <Card className="hover:bg-gray-50 cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <ShoppingBag className="h-8 w-8 mb-2 text-blue-500" />
                  <h3 className="font-medium">Dashboard</h3>
                  <p className="text-xs text-muted-foreground">Overview & Stats</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/vendor/products">
              <Card className="hover:bg-gray-50 cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <Package className="h-8 w-8 mb-2 text-green-500" />
                  <h3 className="font-medium">Products</h3>
                  <p className="text-xs text-muted-foreground">Manage Inventory</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/vendor/orders">
              <Card className="hover:bg-gray-50 cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <ShoppingCart className="h-8 w-8 mb-2 text-purple-500" />
                  <h3 className="font-medium">Orders</h3>
                  <p className="text-xs text-muted-foreground">Customer Orders</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/vendor/analytics">
              <Card className="hover:bg-gray-50 cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <BarChart2 className="h-8 w-8 mb-2 text-orange-500" />
                  <h3 className="font-medium">Analytics</h3>
                  <p className="text-xs text-muted-foreground">Sales & Performance</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/vendor/inventory-alerts">
              <Card className="hover:bg-gray-50 cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <Bell className="h-8 w-8 mb-2 text-red-500" />
                  <h3 className="font-medium">Inventory Alerts</h3>
                  <p className="text-xs text-muted-foreground">Stock Notifications</p>
                </CardContent>
              </Card>
            </Link>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                      <h3 className="text-2xl font-bold">{totalProducts}</h3>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-full">
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-red-50 rounded-full">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                      <h3 className="text-2xl font-bold">{lowStockProducts}</h3>
                    </div>
                  </div>
                  <div className="bg-red-50 p-2 rounded-full">
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-50 rounded-full">
                      <ShoppingBag className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Inventory Value</p>
                      <h3 className="text-2xl font-bold">₹{totalValue.toLocaleString()}</h3>
                    </div>
                  </div>
                  <div className="bg-green-50 p-2 rounded-full">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-orange-50 rounded-full">
                      <ShoppingCart className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <h3 className="text-2xl font-bold">{orders.length}</h3>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-full">
                    <ArrowUpRight className="h-4 w-4 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="day" tick={{ fill: '#888888' }} />
                      <YAxis tick={{ fill: '#888888' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }} 
                        formatter={(value) => [`₹${value}`, 'Sales']}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        name="Daily Sales" 
                        stroke="#138808" 
                        strokeWidth={2}
                        dot={{ fill: '#138808', r: 4 }}
                        activeDot={{ r: 6, fill: '#FF9933' }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your most recent customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[#138808]" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No recent orders</h3>
                    <p className="text-sm text-muted-foreground">
                      New orders will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 3).map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewOrder(order)}
                      >
                        <div>
                          <p className="font-medium">Order #{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} items - ₹{order.totalAmount}
                          </p>
                        </div>
                        <Badge className={
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                        }>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate("/vendor/orders")}>
                      View All Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nearby Customers</CardTitle>
                <CardDescription>Customers in your vicinity</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[300px]">
                {currentLocation ? (
                  <NearbyConsumersMap
                    vendorLocation={currentLocation}
                    consumers={nearbyConsumers}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <MapPin className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">Location unavailable</h3>
                      <p className="text-sm text-muted-foreground">
                        Enable location services to see nearby customers
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={startLocationTracking}
                      >
                        Enable Location
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Distribution</CardTitle>
              <CardDescription>By category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <Pie
                      data={productDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      paddingAngle={2}
                    >
                      {productDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #f0f0f0',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [`${value}%`, 'Percentage']}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      iconSize={10}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>By order status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis dataKey="status" tick={{ fill: '#888888' }} />
                    <YAxis tick={{ fill: '#888888' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #f0f0f0',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [`${value} orders`, 'Orders']}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      iconSize={10}
                    />
                    <Bar dataKey="count" name="Order Count" radius={[4, 4, 0, 0]}>
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>Download your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full flex justify-between items-center" onClick={() => handleExport('orders')}>
                  <span>Export Orders</span>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full flex justify-between items-center" onClick={() => handleExport('inventory')}>
                  <span>Export Inventory</span>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full flex justify-between items-center" onClick={() => handleExport('sales')}>
                  <span>Export Sales Analytics</span>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
              <CardDescription>Manage alert thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Low Stock Alerts</span>
                  <Switch 
                    checked={alertsEnabled} 
                    onCheckedChange={(checked) => {
                      setAlertsEnabled(checked);
                      api.post('/inventory/alerts/settings', {
                        enabled: checked,
                        threshold: alertThreshold
                      }).then(() => {
                        toast({
                          title: "Settings Saved",
                          description: `Inventory alerts ${checked ? 'enabled' : 'disabled'}.`
                        });
                      }).catch(error => {
                        console.error('Error saving settings:', error);
                        toast({
                          title: "Error",
                          description: "Failed to save settings.",
                          variant: "destructive"
                        });
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Stock Threshold</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="threshold" 
                      type="number" 
                      value={alertThreshold} 
                      onChange={(e) => setAlertThreshold(parseInt(e.target.value) || 10)}
                      min={1}
                    />
                    <Button 
                      onClick={() => {
                        api.post('/inventory/alerts/settings', {
                          enabled: alertsEnabled,
                          threshold: alertThreshold
                        }).then(() => {
                          toast({
                            title: "Settings Saved",
                            description: "Alert threshold updated."
                          });
                        }).catch(error => {
                          console.error('Error saving settings:', error);
                          toast({
                            title: "Error",
                            description: "Failed to save settings.",
                            variant: "destructive"
                          });
                        });
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rating Analytics</CardTitle>
              <CardDescription>Your product ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <div className="text-2xl font-bold">{ratingStats.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">({ratingStats.totalRatings} ratings)</div>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="text-sm min-w-8">{rating} ★</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400" 
                          style={{ 
                            width: `${ratingStats.totalRatings > 0 ? 
                              (ratingStats.ratingDistribution[rating-1] / ratingStats.totalRatings) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ratingStats.ratingDistribution[rating-1]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {renderOrderDialog()}
      {renderMarginModal()}

      {/* New Orders Notification */}
      {showOrderNotification && newOrders.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="w-96 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>New Order!</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOrderNotificationClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newOrders.slice(0, 3).map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewOrder(order)}
                  >
                    <div>
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items - ₹{order.totalAmount}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
                {newOrders.length > 3 && (
                  <Button variant="ghost" className="w-full" onClick={() => navigate('/vendor/orders')}>
                    View All Orders ({newOrders.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default VendorDashboard;
