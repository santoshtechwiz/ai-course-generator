import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteQuiz, type DeleteQuizRequest, type DeleteQuizResponse } from "@/app/mutations/delete-quiz";

interface UseDeleteQuizOptions {
  onSuccess?: (data: DeleteQuizResponse) => void;
  onError?: (error: Error) => void;
}

export function useDeleteQuiz(options?: UseDeleteQuizOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuiz,
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["user-quizzes"] });
      
      // Remove specific quiz from cache
      queryClient.removeQueries({ 
        queryKey: ["quiz", variables.quizType, variables.slug] 
      });
      
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
