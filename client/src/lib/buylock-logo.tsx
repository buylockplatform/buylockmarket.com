export function BuyLockLogo({ className = "h-10" }: { className?: string }) {
  return (
    <img 
      src="/buylock-logo.png"
      alt="BuyLock Logo" 
      className={`${className} object-contain`}
      style={{ aspectRatio: 'auto' }}
    />
  );
}
