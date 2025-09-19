import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/user/logout", {
        method: "POST",
      }),
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(["/api/user/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to home/landing page
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local data
      queryClient.setQueryData(["/api/user/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setLocation("/");
    },
  });

  return {
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}