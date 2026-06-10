import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  UserX, 
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  Activity,
  Plus,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddUserModal } from "./AddUserModal";
import { ViewUserModal } from "./ViewUserModal";
import { EditUserModal } from "./EditUserModal";
import { MessageUserModal } from "./MessageUserModal";
import { SuspendUserModal } from "./SuspendUserModal";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profileImageUrl?: string;
  isSuspended?: boolean;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

type UserAction = "view" | "edit" | "message";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeAction, setActiveAction] = useState<UserAction | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openUserAction = (user: User, action: UserAction) => {
    setSelectedUser(user);
    setActiveAction(action);
  };

  const closeUserAction = () => {
    setActiveAction(null);
    setSelectedUser(null);
  };

  // Fetch real users from API
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users', searchTerm],
    retry: false,
  });

  const switchAction = (userId: string, action: UserAction) => {
    const user = users.find((u) => u.id === userId) || selectedUser;
    if (user) {
      setSelectedUser(user);
      setActiveAction(action);
    }
  };

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, suspended, reason }: { userId: string; suspended: boolean; reason?: string }) => {
      return apiRequest(`/api/admin/users/${userId}/suspend`, "PATCH", { suspended, reason });
    },
    onSuccess: (_, { suspended }) => {
      toast({
        title: suspended ? "User suspended" : "User reactivated",
        description: suspended
          ? "The user can no longer log in or place orders."
          : "The user account is active again.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSuspendTarget(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeUserCount = users.filter((u) => !u.isSuspended).length;
  const suspendedUserCount = users.filter((u) => u.isSuspended).length;

  const filteredUsers = users.filter((user: User) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
          <p className="text-gray-600">Manage customer accounts and user activity</p>
        </div>
        <Button 
          className="bg-buylock-primary hover:bg-buylock-primary/90"
          onClick={() => setShowAddUserModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search users by name or email..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
                <SelectItem value="spent">Highest Spent</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{activeUserCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">{suspendedUserCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>User List ({filteredUsers.length} users)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              ))
            ) : (
              filteredUsers.map((user: User) => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User';
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {user.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt={fullName} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{fullName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>Joined: {formatDate(user.createdAt)}</span>
                          <span>•</span>
                          <span>Updated: {formatDate(user.updatedAt)}</span>
                        </div>
                        {user.isSuspended && user.suspensionReason && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {user.suspensionReason}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <Badge className={user.isSuspended ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {user.isSuspended ? "Suspended" : "Active"}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openUserAction(user, "view")}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openUserAction(user, "edit")}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openUserAction(user, "message")}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          {user.isSuspended ? (
                            <DropdownMenuItem
                              className="text-emerald-700 focus:bg-emerald-50"
                              onClick={() =>
                                suspendUserMutation.mutate({ userId: user.id, suspended: false })
                              }
                              disabled={suspendUserMutation.isPending}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Reactivate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-50"
                              onClick={() => setSuspendTarget(user)}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddUserModal 
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
      />

      <ViewUserModal
        userId={selectedUser?.id ?? null}
        isOpen={activeAction === "view"}
        onClose={closeUserAction}
        onEdit={(userId) => switchAction(userId, "edit")}
        onMessage={(userId) => switchAction(userId, "message")}
      />

      <EditUserModal
        userId={selectedUser?.id ?? null}
        isOpen={activeAction === "edit"}
        onClose={closeUserAction}
      />

      <MessageUserModal
        userId={selectedUser?.id ?? null}
        userName={
          selectedUser
            ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() || "Customer"
            : "Customer"
        }
        userEmail={selectedUser?.email}
        isOpen={activeAction === "message"}
        onClose={closeUserAction}
      />

      {suspendTarget && (
        <SuspendUserModal
          userName={
            `${suspendTarget.firstName || ""} ${suspendTarget.lastName || ""}`.trim() || "Customer"
          }
          userEmail={suspendTarget.email}
          isOpen={!!suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={(reason) =>
            suspendUserMutation.mutate({
              userId: suspendTarget.id,
              suspended: true,
              reason,
            })
          }
          isLoading={suspendUserMutation.isPending}
        />
      )}
    </div>
  );
}