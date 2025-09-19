import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["/api/user/me"],
    retry: false,
  });

  return {
    user: response?.user,
    isLoading,
    isAuthenticated: !!response?.user,
  };
}
