import { useCurrency } from "@/contexts/CurrencyContext";

interface PriceDisplayProps {
  price: string | number;
  originalPrice?: string | number;
  className?: string;
  showCurrency?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PriceDisplay({ 
  price, 
  originalPrice, 
  className = "", 
  showCurrency = true,
  size = 'md'
}: PriceDisplayProps) {
  const { formatPrice } = useCurrency();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const formattedPrice = formatPrice(price);
  const formattedOriginalPrice = originalPrice ? formatPrice(originalPrice) : null;

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
        {formattedPrice}
      </span>
      {formattedOriginalPrice && parseFloat(originalPrice as string) > parseFloat(price as string) && (
        <span className={`text-gray-500 line-through text-sm`}>
          {formattedOriginalPrice}
        </span>
      )}
    </div>
  );
}