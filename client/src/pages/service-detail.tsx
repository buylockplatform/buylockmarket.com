import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  Star, 
  Clock, 
  MapPin, 
  Shield, 
  CheckCircle, 
  Calendar as CalendarIcon,
  MessageSquare,
  Phone,
  Mail,
  Plus,
  Minus,
  User,
  Award,
  Navigation,
  FileText
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ServicePriceDisplay } from "@/components/ServicePriceDisplay";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Service } from "@shared/schema";

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [duration, setDuration] = useState(2); // Default 2 hours
  const [notes, setNotes] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState("");
  const [detailedInstructions, setDetailedInstructions] = useState("");
  const [appointmentDate, setAppointmentDate] = useState<Date>();
  const [appointmentTime, setAppointmentTime] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: service, isLoading, error } = useQuery<Service>({
    queryKey: ["/api/services", slug],
    enabled: !!slug,
  });

  // Location functions
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoordinates(`${latitude},${longitude}`);
        setServiceLocation(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setIsLoadingLocation(false);
        
        toast({
          title: "Location captured",
          description: "Your current location has been set for the service",
        });
      },
      (error) => {
        setIsLoadingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please enter your address manually or allow location access",
          variant: "destructive",
        });
      }
    );
  };

  const directBookingMutation = useMutation({
    mutationFn: async () => {
      if (!appointmentDate || !appointmentTime) {
        throw new Error("Please select appointment date and time");
      }
      if (!serviceLocation) {
        throw new Error("Please provide service location");
      }
      
      const response = await apiRequest("/api/services/book", "POST", {
        serviceId: service?.id,
        appointmentDate: appointmentDate.toISOString(),
        appointmentTime,
        duration,
        notes,
        serviceLocation,
        locationCoordinates,
        detailedInstructions,
      });
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Service booked successfully!",
        description: `Booking created for ${format(appointmentDate!, "PPP")} at ${appointmentTime}. Proceed to payment.`,
      });
      
      // Navigate to payment with order details
      setLocation(`/payment?orderId=${data.order.id}&amount=${data.totalAmount}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to book services",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      
      toast({
        title: "Booking failed",
        description: error.message || "Failed to book service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Format price to KES
  const { formatPrice } = useCurrency();

  // Calculate total price based on duration
  const totalPrice = service ? parseFloat(service.price) * duration : 0;

  // Generate available time slots
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <p className="text-gray-600 mb-8">The service you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const rating = 4.8; // In real app, this would come from reviews data
  const reviewCount = 127;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Image */}
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg overflow-hidden">
              {service.imageUrl ? (
                <img 
                  src={service.imageUrl} 
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-buylock-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-buylock-primary" />
                    </div>
                    <p className="text-gray-600 font-medium">{service.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Service Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{service.categoryId}</Badge>
                {service.isActive && (
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{rating}</span>
                  <span className="text-gray-600">({reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Flexible timing</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{service.location || "Remote/On-site"}</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">
                {service.description}
              </p>

              {/* Features */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">What's Included</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "Professional consultation",
                      "Quality guarantee", 
                      "Timely delivery",
                      "Post-service support",
                      "Secure communication",
                      "Flexible scheduling"
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Booking Panel */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Book Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hourly Rate Display */}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ServicePriceDisplay 
                    price={service.price}
                    priceType={service.priceType || 'hourly'}
                    size="xl"
                  />
                </div>

                {/* Duration Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Duration (hours)</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDuration(Math.max(1, duration - 1))}
                      disabled={duration <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-16 text-center font-semibold text-lg">{duration}h</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDuration(duration + 1)}
                      disabled={duration >= 8}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Minimum 1 hour, maximum 8 hours per booking</p>
                </div>

                {/* Date Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !appointmentDate && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {appointmentDate ? format(appointmentDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={appointmentDate}
                        onSelect={setAppointmentDate}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Time</Label>
                  <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Location */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Service Location
                  </Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter your complete address..."
                        value={serviceLocation}
                        onChange={(e) => setServiceLocation(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={isLoadingLocation}
                        className="shrink-0"
                      >
                        {isLoadingLocation ? (
                          "Getting..."
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 mr-1" />
                            Pin Location
                          </>
                        )}
                      </Button>
                    </div>
                    {locationCoordinates && (
                      <p className="text-xs text-green-600">
                        ✓ Location pinned: {locationCoordinates}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detailed Instructions */}
                <div className="space-y-3">
                  <Label htmlFor="instructions" className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Detailed Instructions
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Provide detailed instructions for the service provider:
• Access instructions (gate codes, apartment numbers)
• Specific areas to focus on
• Materials or tools already available
• Any special requirements or preferences..."
                    value={detailedInstructions}
                    onChange={(e) => setDetailedInstructions(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other special requirements or information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Total Price Display */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Cost:</span>
                    <ServicePriceDisplay 
                      price={totalPrice}
                      priceType="fixed"
                      size="xl"
                      className="text-buylock-primary"
                    />
                  </div>
                  {duration > 1 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(service.price)} × {duration} hours
                    </p>
                  )}
                </div>

                {/* Book Service Button */}
                <Button
                  className="w-full bg-buylock-primary hover:bg-buylock-primary/90"
                  onClick={() => directBookingMutation.mutate()}
                  disabled={directBookingMutation.isPending || !isAuthenticated || !appointmentDate || !appointmentTime || !serviceLocation}
                  size="lg"
                >
                  {directBookingMutation.isPending ? (
                    "Processing Booking..."
                  ) : !isAuthenticated ? (
                    "Login to Book Service"
                  ) : !appointmentDate || !appointmentTime ? (
                    "Select Date & Time"
                  ) : !serviceLocation ? (
                    "Add Service Location"
                  ) : (
                    `Book & Pay Now - ${formatPrice(totalPrice)}`
                  )}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  No cart needed • Direct checkout • Secure payment
                </div>

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Need Help?</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>+234 123 456 7890</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>support@buylock.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span>Live chat available</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}