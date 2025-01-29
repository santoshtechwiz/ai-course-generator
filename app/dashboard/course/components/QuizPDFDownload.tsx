import { PDFDownloadLink } from "@react-pdf/renderer";
import dynamic from "next/dynamic";
import QuizPDF, { QuizPDFProps } from "./QuizPDF";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";



const QuizPDFDynamic = dynamic(() => Promise.resolve(QuizPDF), { ssr: false });

const QuizPDFDownload: React.FC<QuizPDFProps> = ({ quizData }) => {
  const quizSlug = "example-quiz"; // Replace with actual quiz slug
  return (
    <PDFDownloadLink document={<QuizPDF quizData={quizData} />} fileName={`${quizSlug}-quiz.pdf`}>
      {({ loading }: { loading: boolean }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="flex-1 md:flex-none md:w-28 transition-all duration-300"
        >
          {loading ? (
            <span className="loader"></span>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">PDF</span>
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default QuizPDFDownload;