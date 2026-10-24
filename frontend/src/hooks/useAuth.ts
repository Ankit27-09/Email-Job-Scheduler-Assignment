import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";

export const meKey = ["me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: meKey,
    queryFn: api.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}
