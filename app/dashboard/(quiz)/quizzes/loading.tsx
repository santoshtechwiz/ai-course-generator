import { PageWrapper } from "@/components/layout/PageWrapper"
import { ComponentLoader } from "@/components/loaders"
import { LOADER_MESSAGES } from "@/constants/loader-messages"

export default function QuizzesLoading() {
  return (
    <PageWrapper>
      <ComponentLoader
        message={LOADER_MESSAGES.LOADING_QUIZ_DATA}
        variant="skeleton"
        size="lg"
        className="min-h-[60vh]"
      />
    </PageWrapper>
  )
}
