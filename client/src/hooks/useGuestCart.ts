import { useState, useEffect } from "react";
import type { Product, Service } from "@shared/schema";

export interface GuestCartItem {
  id: string;
  productId?: string;
  serviceId?: string;
  quantity: number;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentDuration?: number;
  appointmentNotes?: string;
  product?: Product;
  service?: Service;
}

const GUEST_CART_KEY = "buylock_guest_cart";

export function useGuestCart() {
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    if (savedCart) {
      try {
        setGuestCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading guest cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCartItems));
  }, [guestCartItems]);

  const addToGuestCart = (item: Omit<GuestCartItem, 'id'>) => {
    const newItem: GuestCartItem = {
      ...item,
      id: Date.now().toString(),
    };
    
    setGuestCartItems(prev => {
      // Check if item already exists (same product/service)
      const existingIndex = prev.findIndex(
        cartItem => 
          (cartItem.productId && cartItem.productId === item.productId) ||
          (cartItem.serviceId && cartItem.serviceId === item.serviceId)
      );
      
      if (existingIndex >= 0) {
        // Update quantity if item exists
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      } else {
        // Add new item
        return [...prev, newItem];
      }
    });
  };

  const updateGuestCartItem = (id: string, quantity: number) => {
    setGuestCartItems(prev =>
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeFromGuestCart = (id: string) => {
    setGuestCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearGuestCart = () => {
    setGuestCartItems([]);
    localStorage.removeItem(GUEST_CART_KEY);
  };

  const getGuestCartTotal = () => {
    return guestCartItems.reduce((total, item) => {
      const price = item.product?.price || item.service?.price || "0";
      const itemPrice = typeof price === 'string' ? parseFloat(price) : price;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getGuestCartCount = () => {
    return guestCartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return {
    guestCartItems,
    addToGuestCart,
    updateGuestCartItem,
    removeFromGuestCart,
    clearGuestCart,
    getGuestCartTotal,
    getGuestCartCount,
  };
}