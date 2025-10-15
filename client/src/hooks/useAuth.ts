import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<Omit<User, 'password'>>({
    queryKey: ["/api/user/me"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && user.status !== "blocked",
    isPending: user?.status === "pending",
    isBlocked: user?.status === "blocked",
    error,
  };
}
