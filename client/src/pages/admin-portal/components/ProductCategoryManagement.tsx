import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Package,
  Settings,
  Filter,
  Eye,
  ChevronRight,
  Folder,
  FolderOpen
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface ProductAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  categoryId?: string;
  subcategoryId?: string;
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Mock data for demonstration
const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    description: "Electronic devices and gadgets",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
    isActive: true,
    createdAt: "2025-08-10",
    subcategories: [
      {
        id: "1-1",
        name: "Smartphones",
        slug: "smartphones",
        description: "Mobile phones and accessories",
        categoryId: "1",
        isActive: true,
        createdAt: "2025-08-10"
      },
      {
        id: "1-2",
        name: "Laptops",
        slug: "laptops",
        description: "Computers and laptops",
        categoryId: "1",
        isActive: true,
        createdAt: "2025-08-10"
      },
      {
        id: "1-3",
        name: "Audio & Headphones",
        slug: "audio-headphones",
        description: "Headphones, speakers, and audio equipment",
        categoryId: "1",
        isActive: true,
        createdAt: "2025-08-10"
      }
    ]
  },
  {
    id: "2",
    name: "Fashion",
    slug: "fashion",
    description: "Clothing and fashion accessories",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    isActive: true,
    createdAt: "2025-08-10",
    subcategories: [
      {
        id: "2-1",
        name: "Men's Clothing",
        slug: "mens-clothing",
        description: "Clothing for men",
        categoryId: "2",
        isActive: true,
        createdAt: "2025-08-10"
      },
      {
        id: "2-2",
        name: "Women's Clothing",
        slug: "womens-clothing",
        description: "Clothing for women",
        categoryId: "2",
        isActive: true,
        createdAt: "2025-08-10"
      },
      {
        id: "2-3",
        name: "Shoes",
        slug: "shoes",
        description: "Footwear for all",
        categoryId: "2",
        isActive: true,
        createdAt: "2025-08-10"
      }
    ]
  }
];

const mockBrands: Brand[] = [
  {
    id: "b1",
    name: "Samsung",
    slug: "samsung",
    description: "South Korean electronics company",
    logoUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100",
    isActive: true,
    createdAt: "2025-08-10"
  },
  {
    id: "b2",
    name: "Apple",
    slug: "apple",
    description: "American technology company",
    logoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100",
    isActive: true,
    createdAt: "2025-08-10"
  },
  {
    id: "b3",
    name: "Nike",
    slug: "nike",
    description: "American sportswear company",
    logoUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100",
    isActive: true,
    createdAt: "2025-08-10"
  }
];

const mockAttributes: ProductAttribute[] = [
  {
    id: "a1",
    name: "Color",
    type: "select",
    options: ["Black", "White", "Red", "Blue", "Green", "Silver", "Gold"],
    categoryId: "1",
    isRequired: false,
    isFilterable: true,
    displayOrder: 1,
    isActive: true,
    createdAt: "2025-08-10"
  },
  {
    id: "a2",
    name: "Storage Capacity",
    type: "select",
    options: ["64GB", "128GB", "256GB", "512GB", "1TB"],
    subcategoryId: "1-1",
    isRequired: true,
    isFilterable: true,
    displayOrder: 2,
    isActive: true,
    createdAt: "2025-08-10"
  },
  {
    id: "a3",
    name: "Size",
    type: "select",
    options: ["XS", "S", "M", "L", "XL", "XXL"],
    categoryId: "2",
    isRequired: true,
    isFilterable: true,
    displayOrder: 1,
    isActive: true,
    createdAt: "2025-08-10"
  }
];

export default function ProductCategoryManagement() {
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false);
  const [showManageSubcategoriesDialog, setShowManageSubcategoriesDialog] = useState(false);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showAttributeDialog, setShowAttributeDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getStatsForCategories = () => {
    return {
      total: mockCategories.length,
      active: mockCategories.filter(c => c.isActive).length,
      inactive: mockCategories.filter(c => !c.isActive).length,
      totalSubcategories: mockCategories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)
    };
  };

  const getStatsForBrands = () => {
    return {
      total: mockBrands.length,
      active: mockBrands.filter(b => b.isActive).length,
      inactive: mockBrands.filter(b => !b.isActive).length
    };
  };

  const getStatsForAttributes = () => {
    return {
      total: mockAttributes.length,
      required: mockAttributes.filter(a => a.isRequired).length,
      filterable: mockAttributes.filter(a => a.isFilterable).length,
      byType: {
        select: mockAttributes.filter(a => a.type === 'select').length,
        text: mockAttributes.filter(a => a.type === 'text').length,
        number: mockAttributes.filter(a => a.type === 'number').length,
        boolean: mockAttributes.filter(a => a.type === 'boolean').length
      }
    };
  };

  const categoryStats = getStatsForCategories();
  const brandStats = getStatsForBrands();
  const attributeStats = getStatsForAttributes();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Category Management</h2>
          <p className="text-gray-600">Manage categories, subcategories, brands, and product attributes</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Folder className="w-4 h-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>Brands</span>
          </TabsTrigger>
          <TabsTrigger value="attributes" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Attributes</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-4 gap-4 flex-1 mr-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-buylock-primary">{categoryStats.total}</p>
                    <p className="text-sm text-gray-600">Total Categories</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{categoryStats.active}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-500">{categoryStats.inactive}</p>
                    <p className="text-sm text-gray-600">Inactive</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{categoryStats.totalSubcategories}</p>
                    <p className="text-sm text-gray-600">Subcategories</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button className="bg-buylock-primary hover:bg-buylock-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new product category for your marketplace.
                  </DialogDescription>
                </DialogHeader>
                <CategoryForm onClose={() => setShowCategoryDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Categories & Subcategories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg">
                    <div className="p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategoryExpansion(category.id)}
                          >
                            {expandedCategories.has(category.id) ? (
                              <FolderOpen className="w-4 h-4" />
                            ) : (
                              <Folder className="w-4 h-4" />
                            )}
                          </Button>
                          <div>
                            <h3 className="font-semibold text-gray-900">{category.name}</h3>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {category.subcategories?.length || 0} subcategories
                          </span>
                          <div className="flex space-x-2">
                            <Dialog open={showManageSubcategoriesDialog} onOpenChange={setShowManageSubcategoriesDialog}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedCategory(category)}>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[800px]">
                                <DialogHeader>
                                  <DialogTitle>Manage Subcategories - {selectedCategory?.name}</DialogTitle>
                                  <DialogDescription>
                                    View and manage all subcategories under this category
                                  </DialogDescription>
                                </DialogHeader>
                                <SubcategoriesManagementDialog 
                                  category={selectedCategory} 
                                  onClose={() => setShowManageSubcategoriesDialog(false)} 
                                />
                              </DialogContent>
                            </Dialog>
                            <Dialog open={showSubcategoryDialog} onOpenChange={setShowSubcategoryDialog}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedCategory(category)}>
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Sub
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Subcategory to {category.name}</DialogTitle>
                                </DialogHeader>
                                <SubcategoryForm 
                                  categoryId={category.id} 
                                  onClose={() => setShowSubcategoryDialog(false)} 
                                />
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedCategories.has(category.id) && category.subcategories && (
                      <div className="border-t bg-white">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.id} className="p-4 border-b last:border-b-0">
                            <div className="flex items-center justify-between pl-8">
                              <div className="flex items-center space-x-3">
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <div>
                                  <h4 className="font-medium text-gray-800">{subcategory.name}</h4>
                                  <p className="text-xs text-gray-500">{subcategory.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge variant={subcategory.isActive ? "default" : "secondary"}>
                                  {subcategory.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-3 gap-4 flex-1 mr-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-buylock-primary">{brandStats.total}</p>
                    <p className="text-sm text-gray-600">Total Brands</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{brandStats.active}</p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-500">{brandStats.inactive}</p>
                    <p className="text-sm text-gray-600">Inactive</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
              <DialogTrigger asChild>
                <Button className="bg-buylock-primary hover:bg-buylock-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Brand</DialogTitle>
                </DialogHeader>
                <BrandForm onClose={() => setShowBrandDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Brand Directory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockBrands.map((brand) => (
                  <Card key={brand.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <Tag className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                        <p className="text-sm text-gray-600">{brand.description}</p>
                        <Badge variant={brand.isActive ? "default" : "secondary"} className="mt-1">
                          {brand.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attributes Tab */}
        <TabsContent value="attributes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-4 gap-4 flex-1 mr-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-buylock-primary">{attributeStats.total}</p>
                    <p className="text-sm text-gray-600">Total Attributes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{attributeStats.required}</p>
                    <p className="text-sm text-gray-600">Required</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{attributeStats.filterable}</p>
                    <p className="text-sm text-gray-600">Filterable</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{attributeStats.byType.select}</p>
                    <p className="text-sm text-gray-600">Select Type</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
              <DialogTrigger asChild>
                <Button className="bg-buylock-primary hover:bg-buylock-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Attribute
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Product Attribute</DialogTitle>
                </DialogHeader>
                <AttributeForm onClose={() => setShowAttributeDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAttributes.map((attribute) => (
                  <div key={attribute.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{attribute.name}</h3>
                          <Badge variant="outline">{attribute.type}</Badge>
                          {attribute.isRequired && <Badge variant="destructive">Required</Badge>}
                          {attribute.isFilterable && <Badge variant="secondary">Filterable</Badge>}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {attribute.categoryId && "Category-wide"} 
                          {attribute.subcategoryId && "Subcategory-specific"}
                          {attribute.options && (
                            <div className="mt-1">
                              <span className="font-medium">Options:</span> {attribute.options.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Categories</span>
                    <span className="font-semibold">{categoryStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Categories</span>
                    <span className="font-semibold text-green-600">{categoryStats.active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Subcategories</span>
                    <span className="font-semibold">{categoryStats.totalSubcategories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Brands</span>
                    <span className="font-semibold">{brandStats.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attribute Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Attributes</span>
                    <span className="font-semibold">{attributeStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required Attributes</span>
                    <span className="font-semibold text-red-600">{attributeStats.required}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filterable Attributes</span>
                    <span className="font-semibold text-blue-600">{attributeStats.filterable}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">By Type:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Select</span>
                        <span>{attributeStats.byType.select}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Text</span>
                        <span>{attributeStats.byType.text}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Number</span>
                        <span>{attributeStats.byType.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Boolean</span>
                        <span>{attributeStats.byType.boolean}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Form Components
function CategoryForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Category form data:", formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Electronics"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., electronics"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Category description..."
        />
      </div>
      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-buylock-primary hover:bg-buylock-primary/90">
          Create Category
        </Button>
      </DialogFooter>
    </form>
  );
}

function SubcategoryForm({ categoryId, onClose }: { categoryId: string; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subcategory form data:", { ...formData, categoryId });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Subcategory Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Smartphones"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., smartphones"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Subcategory description..."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-buylock-primary hover:bg-buylock-primary/90">
          Create Subcategory
        </Button>
      </DialogFooter>
    </form>
  );
}

function BrandForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Brand form data:", formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Brand Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Samsung"
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., samsung"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brand description..."
        />
      </div>
      <div>
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          value={formData.logoUrl}
          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-buylock-primary hover:bg-buylock-primary/90">
          Create Brand
        </Button>
      </DialogFooter>
    </form>
  );
}

function AttributeForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "select" as const,
    options: "",
    categoryId: "",
    subcategoryId: "",
    isRequired: false,
    isFilterable: true,
    displayOrder: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const optionsArray = formData.options ? formData.options.split(",").map(s => s.trim()) : [];
    console.log("Attribute form data:", { ...formData, options: optionsArray });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Attribute Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Color"
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {formData.type === "select" && (
        <div>
          <Label htmlFor="options">Options (comma-separated)</Label>
          <Input
            id="options"
            value={formData.options}
            onChange={(e) => setFormData({ ...formData, options: e.target.value })}
            placeholder="e.g., Red, Blue, Green, Black"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="categoryId">Category (optional)</Label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {mockCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="flex space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="isRequired"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
          />
          <Label htmlFor="isRequired">Required</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isFilterable"
            checked={formData.isFilterable}
            onCheckedChange={(checked) => setFormData({ ...formData, isFilterable: checked })}
          />
          <Label htmlFor="isFilterable">Filterable</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-buylock-primary hover:bg-buylock-primary/90">
          Create Attribute
        </Button>
      </DialogFooter>
    </form>
  );
}

function SubcategoriesManagementDialog({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!category) return null;

  const subcategories = category.subcategories || [];

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            {subcategories.length} subcategories in {category.name}
          </p>
        </div>
        <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-buylock-primary hover:bg-buylock-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Subcategory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subcategory to {category.name}</DialogTitle>
            </DialogHeader>
            <SubcategoryForm 
              categoryId={category.id} 
              onClose={() => setShowAddSubcategoryDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Subcategories List */}
      <div className="max-h-96 overflow-y-auto">
        {subcategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No subcategories found</p>
            <p className="text-sm">Add a subcategory to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subcategories.map((subcategory) => (
              <div key={subcategory.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{subcategory.name}</h4>
                        <p className="text-sm text-gray-600">{subcategory.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={subcategory.isActive ? "default" : "secondary"} className="text-xs">
                            {subcategory.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-gray-500">Slug: {subcategory.slug}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog open={showEditDialog && selectedSubcategory?.id === subcategory.id} 
                           onOpenChange={(open) => {
                             setShowEditDialog(open);
                             if (!open) setSelectedSubcategory(null);
                           }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedSubcategory(subcategory)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Subcategory</DialogTitle>
                        </DialogHeader>
                        <EditSubcategoryForm 
                          subcategory={selectedSubcategory} 
                          onClose={() => {
                            setShowEditDialog(false);
                            setSelectedSubcategory(null);
                          }} 
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </div>
  );
}

function EditSubcategoryForm({ subcategory, onClose }: { subcategory: Subcategory | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: subcategory?.name || "",
    slug: subcategory?.slug || "",
    description: subcategory?.description || "",
    imageUrl: subcategory?.imageUrl || "",
    isActive: subcategory?.isActive || true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Edit subcategory form data:", { ...formData, id: subcategory?.id });
    onClose();
  };

  if (!subcategory) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-name">Subcategory Name</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Smartphones"
          />
        </div>
        <div>
          <Label htmlFor="edit-slug">Slug</Label>
          <Input
            id="edit-slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="e.g., smartphones"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Subcategory description..."
        />
      </div>
      <div>
        <Label htmlFor="edit-imageUrl">Image URL (Optional)</Label>
        <Input
          id="edit-imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="edit-isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="edit-isActive">Active</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-buylock-primary hover:bg-buylock-primary/90">
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}