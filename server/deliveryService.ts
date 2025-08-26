import { 
  DeliveryProvider, 
  Delivery, 
  DeliveryUpdate, 
  InsertDelivery, 
  InsertDeliveryUpdate,
  Order 
} from "@shared/schema";

// Standardized courier API interface
export interface CourierAPIProvider {
  createDelivery(delivery: DeliveryRequest): Promise<CourierResponse>;
  getDeliveryStatus(trackingId: string): Promise<CourierStatus>;
  cancelDelivery(trackingId: string): Promise<boolean>;
}

export interface DeliveryRequest {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerPhone: string;
  vendorPhone: string;
  packageDescription: string;
  specialInstructions?: string;
  estimatedWeight?: number;
  declaredValue?: number;
}

export interface CourierResponse {
  success: boolean;
  trackingId?: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  error?: string;
}

export interface CourierStatus {
  trackingId: string;
  status: string;
  description: string;
  location?: string;
  timestamp: Date;
  estimatedDelivery?: Date;
}

// G4S Courier Implementation
export class G4SCourierAPI implements CourierAPIProvider {
  private apiKey: string;
  private baseUrl = "https://api.g4s.co.ke";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createDelivery(request: DeliveryRequest): Promise<CourierResponse> {
    try {
      // Simulate G4S API call
      const response = await fetch(`${this.baseUrl}/deliveries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_address: request.pickupAddress,
          delivery_address: request.deliveryAddress,
          customer_phone: request.customerPhone,
          vendor_phone: request.vendorPhone,
          package_description: request.packageDescription,
          special_instructions: request.specialInstructions,
          weight: request.estimatedWeight,
          declared_value: request.declaredValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`G4S API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        trackingId: data.tracking_id,
        estimatedPickupTime: new Date(data.estimated_pickup),
        estimatedDeliveryTime: new Date(data.estimated_delivery),
      };
    } catch (error) {
      console.error('G4S API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getDeliveryStatus(trackingId: string): Promise<CourierStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/deliveries/${trackingId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`G4S API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        trackingId,
        status: data.status,
        description: data.description,
        location: data.location,
        timestamp: new Date(data.timestamp),
        estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
      };
    } catch (error) {
      console.error('G4S Status API Error:', error);
      throw error;
    }
  }

  async cancelDelivery(trackingId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/deliveries/${trackingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('G4S Cancel API Error:', error);
      return false;
    }
  }
}

// Fargo Courier Implementation
export class FargoCourierAPI implements CourierAPIProvider {
  private apiKey: string;
  private baseUrl = "https://api.fargocourier.co.ke";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createDelivery(request: DeliveryRequest): Promise<CourierResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: request.pickupAddress,
          destination: request.deliveryAddress,
          sender_phone: request.vendorPhone,
          recipient_phone: request.customerPhone,
          item_description: request.packageDescription,
          notes: request.specialInstructions,
          weight_kg: request.estimatedWeight,
          value: request.declaredValue,
        }),
      });

      if (!response.ok) {
        throw new Error(`Fargo API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        trackingId: data.waybill_number,
        estimatedPickupTime: new Date(data.pickup_eta),
        estimatedDeliveryTime: new Date(data.delivery_eta),
      };
    } catch (error) {
      console.error('Fargo API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getDeliveryStatus(trackingId: string): Promise<CourierStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${trackingId}/track`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Fargo API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        trackingId,
        status: data.current_status,
        description: data.status_description,
        location: data.current_location,
        timestamp: new Date(data.last_updated),
        estimatedDelivery: data.delivery_eta ? new Date(data.delivery_eta) : undefined,
      };
    } catch (error) {
      console.error('Fargo Status API Error:', error);
      throw error;
    }
  }

  async cancelDelivery(trackingId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments/${trackingId}/cancel`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Fargo Cancel API Error:', error);
      return false;
    }
  }
}

// Delivery Service Manager
export class DeliveryService {
  private providers: Map<string, CourierAPIProvider> = new Map();

  constructor() {
    // Initialize courier providers (API keys would come from environment variables)
    this.providers.set('g4s', new G4SCourierAPI(process.env.G4S_API_KEY || 'demo-key'));
    this.providers.set('fargo_courier', new FargoCourierAPI(process.env.FARGO_API_KEY || 'demo-key'));
  }

  async createDelivery(order: Order, provider: DeliveryProvider): Promise<CourierResponse> {
    const courierAPI = this.providers.get(provider.id);
    if (!courierAPI) {
      throw new Error(`Courier provider ${provider.id} not supported`);
    }

    const deliveryRequest: DeliveryRequest = {
      orderId: order.id,
      pickupAddress: "BuyLock Vendor Address", // This should come from vendor profile
      deliveryAddress: order.deliveryAddress || "No address provided",
      customerPhone: "0700000000", // This should come from user profile
      vendorPhone: "0700000001", // This should come from vendor profile
      packageDescription: `Order ${order.id} - ${order.orderType}`,
      specialInstructions: order.notes || undefined,
      estimatedWeight: 1.0, // Default weight, could be calculated from order items
      declaredValue: parseFloat(order.totalAmount.toString()),
    };

    return await courierAPI.createDelivery(deliveryRequest);
  }

  async getDeliveryStatus(providerId: string, trackingId: string): Promise<CourierStatus> {
    const courierAPI = this.providers.get(providerId);
    if (!courierAPI) {
      throw new Error(`Courier provider ${providerId} not supported`);
    }

    return await courierAPI.getDeliveryStatus(trackingId);
  }

  async cancelDelivery(providerId: string, trackingId: string): Promise<boolean> {
    const courierAPI = this.providers.get(providerId);
    if (!courierAPI) {
      throw new Error(`Courier provider ${providerId} not supported`);
    }

    return await courierAPI.cancelDelivery(trackingId);
  }

  mapCourierStatusToInternal(courierStatus: string, providerId: string): string {
    // Standardize status across different courier providers
    const statusMap: Record<string, Record<string, string>> = {
      g4s: {
        'created': 'pending',
        'pickup_scheduled': 'pickup_scheduled',
        'picked_up': 'picked_up',
        'in_transit': 'in_transit',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'failed': 'failed',
        'cancelled': 'cancelled',
      },
      fargo_courier: {
        'booked': 'pending',
        'pickup_arranged': 'pickup_scheduled',
        'collected': 'picked_up',
        'in_warehouse': 'in_transit',
        'out_for_delivery': 'out_for_delivery',
        'delivered': 'delivered',
        'delivery_failed': 'failed',
        'cancelled': 'cancelled',
      },
    };

    return statusMap[providerId]?.[courierStatus] || courierStatus;
  }
}

export const deliveryService = new DeliveryService();