import { Truck, Shield, Headphones } from "lucide-react";

export function WhyChoose() {
  const features = [
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Get your orders delivered in under 45 minutes with our express delivery service"
    },
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "Shop with confidence knowing your payments and personal data are protected"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Our customer support team is always ready to help you with any questions"
    }
  ];

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Why Choose BuyLock?</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="w-16 h-16 bg-buylock-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <feature.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
