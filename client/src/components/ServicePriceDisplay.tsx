import { useCurrency } from "@/contexts/CurrencyContext";

interface ServicePriceDisplayProps {
  price: string | number;
  priceType?: 'hourly' | 'fixed' | 'per_project';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ServicePriceDisplay({ 
  price, 
  priceType = 'hourly',
  className = "", 
  size = 'md'
}: ServicePriceDisplayProps) {
  const { formatPrice } = useCurrency();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const formattedPrice = formatPrice(price);
  
  const getSuffix = () => {
    switch (priceType) {
      case 'hourly':
        return '/hour';
      case 'per_project':
        return '/project';
      case 'fixed':
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
        {formattedPrice}
      </span>
      {getSuffix() && (
        <span className="text-sm text-gray-600">
          {getSuffix()}
        </span>
      )}
    </div>
  );
}