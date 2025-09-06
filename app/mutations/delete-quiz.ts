import { api } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

export interface DeleteQuizRequest {
  slug: string;
  quizType: string;
}

export interface DeleteQuizResponse {
  message: string;
}

/**
 * Delete a quiz by slug and type
 */
export async function deleteQuiz({ slug, quizType }: DeleteQuizRequest): Promise<DeleteQuizResponse> {
  try {
    const response = await api.delete<DeleteQuizResponse>(`/api/quizzes/${quizType}/${slug}`);
    
    toast({
      title: "Success",
      description: "Quiz deleted successfully",
    });
    
    return response.data;
  } catch (error) {
    console.error("Delete quiz error:", error);
    throw error;
  }
}
