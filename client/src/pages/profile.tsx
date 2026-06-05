import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Phone, MapPin, Edit3, Save, X, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressData, setNewAddressData] = useState({
    label: '',
    addressLine: '',
    building: '',
    suburb: '',
    city: '',
    postalCode: '',
    isDefault: false
  });

  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/me"],
  });

  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || 'Kenya',
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return await apiRequest('/api/user/profile', 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest('/api/user/change-password', 'PUT', data);
    },
    onSuccess: () => {
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  const { data: addresses = [] } = useQuery<any[]>({
    queryKey: ["/api/user/addresses"],
  });

  const addAddressMutation = useMutation({
    mutationFn: async (newAddress: any) => {
      return await apiRequest('/api/user/addresses', 'POST', newAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/addresses"] });
      toast({
        title: "Address Added",
        description: "Your delivery address has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add address.",
        variant: "destructive",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/user/addresses/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/addresses"] });
      toast({
        title: "Address Deleted",
        description: "Saved address has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address.",
        variant: "destructive",
      });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/user/addresses/${id}`, 'PUT', { isDefault: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/addresses"] });
      toast({
        title: "Default Updated",
        description: "Default address updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default address.",
        variant: "destructive",
      });
    },
  });

  const handleAddAddress = () => {
    if (!newAddressData.addressLine || !newAddressData.city) {
      toast({
        title: "Validation Error",
        description: "Street address and City are required fields.",
        variant: "destructive",
      });
      return;
    }

    addAddressMutation.mutate(newAddressData, {
      onSuccess: () => {
        setIsAddAddressOpen(false);
        setNewAddressData({
          label: '',
          addressLine: '',
          building: '',
          suburb: '',
          city: '',
          postalCode: '',
          isDefault: false
        });
      }
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-buylock-cream">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-buylock-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-buylock-cream">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-buylock-charcoal mb-2">My Profile</h1>
            <p className="text-buylock-charcoal/70">Manage your account information and preferences</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-buylock-primary text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-white hover:bg-white/20"
                    data-testid="button-edit-profile"
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={formData.firstName || ''}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="mt-1"
                          data-testid="input-firstName"
                        />
                      ) : (
                        <p className="mt-1 p-2 bg-gray-50 rounded border" data-testid="text-firstName">
                          {formData.firstName || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={formData.lastName || ''}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="mt-1"
                          data-testid="input-lastName"
                        />
                      ) : (
                        <p className="mt-1 p-2 bg-gray-50 rounded border" data-testid="text-lastName">
                          {formData.lastName || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </Label>
                    <p className="mt-1 p-2 bg-gray-50 rounded border text-gray-600" data-testid="text-email">
                      {user?.email} (cannot be changed)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+254712345678"
                        className="mt-1"
                        data-testid="input-phone"
                      />
                    ) : (
                      <p className="mt-1 p-2 bg-gray-50 rounded border" data-testid="text-phone">
                        {formData.phone || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Address</span>
                    </Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Your address"
                        className="mt-1"
                        rows={2}
                        data-testid="input-address"
                      />
                    ) : (
                      <p className="mt-1 p-2 bg-gray-50 rounded border" data-testid="text-address">
                        {formData.address || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="Nairobi"
                          className="mt-1"
                          data-testid="input-city"
                        />
                      ) : (
                        <p className="mt-1 p-2 bg-gray-50 rounded border" data-testid="text-city">
                          {formData.city || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      {isEditing ? (
                        <Input
                          id="country"
                          value={formData.country || ''}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          placeholder="Kenya"
                          className="mt-1"
                          data-testid="input-country"
                        />
                      ) : (
                        <p className="mt-1 p-2 bg-gray-50 rounded border" data-testid="text-country">
                          {formData.country || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="bg-buylock-primary hover:bg-buylock-primary/90"
                        data-testid="button-save-profile"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-buylock-secondary text-white">
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!showPasswordForm ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Update your password to keep your account secure.</p>
                    <Button
                      onClick={() => setShowPasswordForm(true)}
                      variant="outline"
                      className="border-buylock-secondary text-buylock-secondary hover:bg-buylock-secondary hover:text-white"
                      data-testid="button-change-password"
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="mt-1"
                        data-testid="input-currentPassword"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="mt-1"
                        placeholder="At least 8 characters"
                        data-testid="input-newPassword"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="mt-1"
                        data-testid="input-confirmPassword"
                      />
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={handleChangePassword}
                        disabled={changePasswordMutation.isPending}
                        className="bg-buylock-secondary hover:bg-buylock-secondary/90"
                        data-testid="button-save-password"
                      >
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        data-testid="button-cancel-password"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Addresses Section */}
          <Card className="border-0 shadow-lg mt-8">
            <CardHeader className="bg-buylock-charcoal text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Saved Delivery Addresses</span>
                </CardTitle>
                <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Plus className="w-4 h-4 mr-1" /> Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Saved Address</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="addressLabel">Label (e.g. Home, Work) *</Label>
                        <Input
                          id="addressLabel"
                          placeholder="Home"
                          value={newAddressData.label}
                          onChange={(e) => setNewAddressData(prev => ({ ...prev, label: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressLine">Street Address / Location *</Label>
                        <Input
                          id="addressLine"
                          placeholder="123 Ngong Road"
                          value={newAddressData.addressLine}
                          onChange={(e) => setNewAddressData(prev => ({ ...prev, addressLine: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="addressBuilding">Building (Optional)</Label>
                          <Input
                            id="addressBuilding"
                            placeholder="Green Plaza, Apt 4B"
                            value={newAddressData.building}
                            onChange={(e) => setNewAddressData(prev => ({ ...prev, building: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="addressSuburb">Suburb (Optional)</Label>
                          <Input
                            id="addressSuburb"
                            placeholder="Kilimani"
                            value={newAddressData.suburb}
                            onChange={(e) => setNewAddressData(prev => ({ ...prev, suburb: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="addressCity">City *</Label>
                          <Input
                            id="addressCity"
                            placeholder="Nairobi"
                            value={newAddressData.city}
                            onChange={(e) => setNewAddressData(prev => ({ ...prev, city: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="addressPostalCode">Postal Code (Optional)</Label>
                          <Input
                            id="addressPostalCode"
                            placeholder="00100"
                            value={newAddressData.postalCode}
                            onChange={(e) => setNewAddressData(prev => ({ ...prev, postalCode: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          id="addressDefault"
                          type="checkbox"
                          checked={newAddressData.isDefault}
                          onChange={(e) => setNewAddressData(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="rounded border-gray-300 text-buylock-primary focus:ring-buylock-primary h-4 w-4"
                          style={{ accentColor: '#FF4605' }}
                        />
                        <Label htmlFor="addressDefault" className="cursor-pointer">Set as default delivery address</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddAddressOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddAddress} disabled={addAddressMutation.isPending} className="bg-buylock-primary hover:bg-buylock-primary/90">
                        {addAddressMutation.isPending ? "Saving..." : "Save Address"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>You haven't saved any delivery addresses yet.</p>
                  <p className="text-sm">Save your frequent locations to speed up checkout.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      className={`p-4 rounded-lg border transition-all relative ${
                        addr.isDefault 
                          ? "border-buylock-primary/50 bg-buylock-primary/5" 
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-buylock-charcoal capitalize">
                            {addr.label || "Address"}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-buylock-primary text-white px-2 py-0.5 rounded-full font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteAddressMutation.mutate(addr.id)}
                          className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
                          disabled={deleteAddressMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 space-y-1 pr-6">
                        <p>{addr.addressLine}</p>
                        {addr.building && <p>{addr.building}</p>}
                        <p>
                          {[addr.suburb, addr.city].filter(Boolean).join(", ")}
                          {addr.postalCode && ` - ${addr.postalCode}`}
                        </p>
                      </div>
                      {!addr.isDefault && (
                        <button
                          onClick={() => setDefaultAddressMutation.mutate(addr.id)}
                          className="mt-3 text-xs text-buylock-primary font-medium hover:underline block text-left"
                          disabled={setDefaultAddressMutation.isPending}
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}