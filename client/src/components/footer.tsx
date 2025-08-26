import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { BuyLockLogo } from "@/lib/buylock-logo";

export function Footer() {
  return (
    <footer className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <BuyLockLogo className="h-8 max-w-16" />
            </div>
            <p className="text-gray-600 mb-4">
              Your trusted marketplace for products and services with fast delivery and secure shopping.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-buylock-primary">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-buylock-primary">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-buylock-primary">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-buylock-primary">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">About Us</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Contact</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Careers</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Blog</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Help Center</Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              <Link href="/shop?category=electronics" className="block text-gray-600 hover:text-buylock-primary">Electronics</Link>
              <Link href="/shop?category=fashion" className="block text-gray-600 hover:text-buylock-primary">Fashion</Link>
              <Link href="/shop?category=home-kitchen" className="block text-gray-600 hover:text-buylock-primary">Home & Kitchen</Link>
              <Link href="/shop?category=health-beauty" className="block text-gray-600 hover:text-buylock-primary">Health & Beauty</Link>
              <Link href="/shop?product_type=services" className="block text-gray-600 hover:text-buylock-primary">Services</Link>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Customer Service</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Track Order</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Returns</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Shipping Info</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Privacy Policy</Link>
              <Link href="#" className="block text-gray-600 hover:text-buylock-primary">Terms & Conditions</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-8 pt-8 text-center">
          <p className="text-gray-600">&copy; {new Date().getFullYear()} BuyLock. All rights reserved. Buy & Sell In Peace.</p>
        </div>
      </div>
    </footer>
  );
}
