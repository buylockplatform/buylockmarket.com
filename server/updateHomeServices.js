const { db } = require('./db.ts');
const { services } = require('../shared/schema.ts');

async function updateHomeServices() {
  try {
    // Update existing service to home cleaning
    await db.update(services)
      .set({
        name: 'Home Cleaning Service',
        shortDescription: 'Professional home cleaning service',
        description: 'Comprehensive home cleaning including dusting, vacuuming, mopping, bathroom and kitchen cleaning. Our certified cleaners bring all necessary supplies.',
        price: '1500.00',
        priceType: 'hourly',
        location: 'Nairobi Metro',
        tags: ['cleaning', 'home-service', 'hourly'],
        isFeatured: true
      })
      .where(eq(services.slug, 'digital-marketing-strategy'));

    console.log('Updated existing service to home cleaning');

    // Add new home-based services
    const homeServices = [
      {
        name: 'Drywalling & Painting',
        slug: 'drywalling-painting',
        description: 'Professional drywalling, plastering, and interior painting services. Includes wall repair, texture application, priming, and high-quality paint application.',
        shortDescription: 'Wall repair, plastering, interior painting',
        price: '2500.00',
        priceType: 'hourly',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500',
        categoryId: '111754e8-8693-4bfb-8acc-822cdd779461',
        providerId: '74bf6c33-7f09-4844-903d-72bff3849c95',
        tags: ['painting', 'drywalling', 'home-improvement', 'hourly'],
        location: 'Nairobi & Surrounding Areas',
        isFeatured: true,
        isAvailableToday: true
      },
      {
        name: 'Landscaping & Garden Design',
        slug: 'landscaping-garden-design',
        description: 'Complete landscaping services including garden design, lawn maintenance, tree pruning, flower bed creation, and irrigation system installation.',
        shortDescription: 'Garden design, lawn care, tree pruning',
        price: '2000.00',
        priceType: 'hourly',
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
        categoryId: '111754e8-8693-4bfb-8acc-822cdd779461',
        providerId: '74bf6c33-7f09-4844-903d-72bff3849c95',
        tags: ['landscaping', 'gardening', 'outdoor', 'hourly'],
        location: 'Nairobi Metro',
        isFeatured: true,
        isAvailableToday: true
      },
      {
        name: 'Plumbing Repair Service',
        slug: 'plumbing-repair-service',
        description: 'Licensed plumber for all your plumbing needs including pipe repairs, fixture installation, drain cleaning, and emergency leak repairs.',
        shortDescription: 'Pipe repairs, fixture installation, leak repairs',
        price: '3000.00',
        priceType: 'hourly',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500',
        categoryId: '111754e8-8693-4bfb-8acc-822cdd779461',
        providerId: '74bf6c33-7f09-4844-903d-72bff3849c95',
        tags: ['plumbing', 'repair', 'home-service', 'hourly'],
        location: 'Nairobi & Kiambu',
        isFeatured: false,
        isAvailableToday: true
      },
      {
        name: 'Electrical Installation & Repair',
        slug: 'electrical-installation-repair',
        description: 'Certified electrician for home wiring, outlet installation, lighting fixture setup, electrical panel upgrades, and safety inspections.',
        shortDescription: 'Wiring, outlets, lighting, electrical panels',
        price: '3500.00',
        priceType: 'hourly',
        imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500',
        categoryId: '111754e8-8693-4bfb-8acc-822cdd779461',
        providerId: '74bf6c33-7f09-4844-903d-72bff3849c95',
        tags: ['electrical', 'wiring', 'home-service', 'hourly'],
        location: 'Nairobi Metro',
        isFeatured: false,
        isAvailableToday: true
      },
      {
        name: 'Carpentry & Furniture Repair',
        slug: 'carpentry-furniture-repair',
        description: 'Skilled carpenter for custom furniture, cabinet installation, door hanging, window repairs, and general woodworking projects.',
        shortDescription: 'Custom furniture, cabinets, door repairs',
        price: '2200.00',
        priceType: 'hourly',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500',
        categoryId: '111754e8-8693-4bfb-8acc-822cdd779461',
        providerId: '74bf6c33-7f09-4844-903d-72bff3849c95',
        tags: ['carpentry', 'furniture', 'woodworking', 'hourly'],
        location: 'Nairobi & Surrounding Areas',
        isFeatured: false,
        isAvailableToday: true
      }
    ];

    for (const service of homeServices) {
      await db.insert(services).values(service).onConflictDoUpdate({
        target: services.slug,
        set: {
          name: service.name,
          description: service.description,
          shortDescription: service.shortDescription,
          price: service.price,
          priceType: service.priceType,
          imageUrl: service.imageUrl,
          location: service.location,
          isFeatured: service.isFeatured,
          tags: service.tags
        }
      });
    }

    console.log('Home-based services added successfully!');
  } catch (error) {
    console.error('Error updating services:', error);
  }
}

updateHomeServices();