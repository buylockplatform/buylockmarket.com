import { useQuery } from "@tanstack/react-query";

import { User } from "@shared/schema";

export function useAuth() {
  const { data: response, isLoading } = useQuery<{ user: User | null }>({
    queryKey: ["/api/user/me"],
    retry: false,
  });

  return {
    user: response?.user,
    isLoading,
    isAuthenticated: !!response?.user,
  };
}
