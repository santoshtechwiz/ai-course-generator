import ConfigurableQuizPDF from "@/app/dashboard/create/components/ConfigurableQuizPDF";
import QuizPDFDownload from "@/app/dashboard/create/components/QuizPDFDownload";
import { useState, useEffect, FC } from "react";
interface Question {
  question: string
  options?: string[] | null
  answer?: string
}

export interface QuizPDFProps {
  disabled?: boolean
  quizData: {
    title: string
    description?: string
    questions: Question[]
  }
  config?: {
    showOptions?: boolean
    showAnswerSpace?: boolean
    answerSpaceHeight?: number
    showAnswers?: boolean
  }
}
const PdfButton: FC<QuizPDFProps> = ({ quizData, config = {} }) => {
    const [isClient, setIsClient] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleDownload = async () => {
        if (isDownloading) return;

        setIsDownloading(true);
        try {
            const { pdf } = await import("@react-pdf/renderer")
            const blob = await pdf(
                <QuizPDFDownload quizData={quizData} config={{ showOptions: true, showAnswers: true }} />
            ).toBlob()

            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${quizData?.title || "quiz"}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Download error:", error);
            alert("Failed to download the PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isClient) return null;

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary"
        >
            {isDownloading ? "Downloading..." : "Download PDF"}
        </button>
    );
}
export default PdfButton;