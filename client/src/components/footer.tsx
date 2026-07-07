import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { BuyLockLogo } from "@/lib/buylock-logo";

const columns = [
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Help Center", href: "#" },
    ],
  },
  {
    heading: "Categories",
    links: [
      { label: "Electronics", href: "/shop?category=electronics" },
      { label: "Fashion", href: "/shop?category=fashion" },
      { label: "Home & Kitchen", href: "/shop?category=home-kitchen" },
      { label: "Health & Beauty", href: "/shop?category=health-beauty" },
      { label: "Sports", href: "/shop?category=sports" },
      { label: "Books", href: "/shop?category=books" },
      { label: "Services", href: "/shop?product_type=services" },
    ],
  },
  {
    heading: "Customer Service",
    links: [
      { label: "Track Order", href: "#" },
      { label: "Returns", href: "#" },
      { label: "Shipping Info", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms & Conditions", href: "#" },
    ],
  },
];

const socials = [
  { Icon: Facebook,  href: "#" },
  { Icon: Twitter,   href: "#" },
  { Icon: Instagram, href: "#" },
  { Icon: Linkedin,  href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#F1F5F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <BuyLockLogo className="h-8 max-w-[6rem]" />
            </div>
            <p className="text-[13px] text-[#6B7280] mb-5 leading-relaxed">
              Your trusted marketplace for products and services with fast delivery and secure shopping.
            </p>
            <div className="flex items-center gap-2">
              {socials.map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-full border border-[#F1F5F9] flex items-center justify-center text-[#9CA3AF] hover:bg-[#FF5A1F] hover:text-white hover:border-[#FF5A1F] transition-all duration-180"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="text-[13px] font-semibold text-[#111827] mb-4 uppercase tracking-wide">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-[#6B7280] hover:text-[#FF5A1F] transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#F1F5F9] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#9CA3AF]">
            © {new Date().getFullYear()} BuyLock. All rights reserved.
          </p>
          <p className="text-[12px] text-[#9CA3AF] font-medium">Buy & Sell in Peace.</p>
        </div>
      </div>
    </footer>
  );
}
