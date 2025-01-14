'use client'

import React, { useState, useEffect, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import ComponentLoader from '../ComponentLoader';

interface CourseAISummaryProps {
  chapterId: number;
  name: string;
  onSummaryReady: (isReady: boolean) => void;
}

interface SummaryResponse {
  success: boolean;
  data?: string;
  message?: string;
}

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 30000; // 30 seconds

const fetchChapterSummary = async (chapterId: number): Promise<SummaryResponse> => {
  const response = await axios.post<SummaryResponse>(`/api/summary`, { chapterId });
  return response.data;
};

const CourseAISummary: React.FC<CourseAISummaryProps> = ({ chapterId, name ,onSummaryReady }) => {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchChapterSummary(chapterId);
      onSummaryReady(response.success && !!response.data);
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, RETRY_INTERVAL);
      }
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, onSummaryReady]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const content = useMemo(() => {
    if (isLoading || (!data?.success && retryCount < MAX_RETRIES)) {
      return (
       
          <ComponentLoader size="sm" />

      );
    }

    if (error || (retryCount >= MAX_RETRIES && (!data?.success || !data?.data))) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <p className="text-muted-foreground">
            We're having trouble retrieving the content. Please check your connection and try again.
          </p>
          <Button onClick={fetchSummary}>Retry</Button>
        </motion.div>
      );
    }

    if (data?.success && data.data) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">{name}</h2>
          <div className="text-muted-foreground">
            <ReactMarkdown
              className="prose lg:prose-xl dark:prose-invert"
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {data.data}
            </ReactMarkdown>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <p className="text-muted-foreground">No content available at the moment. Please try again later.</p>
        <Button onClick={fetchSummary}>Retry</Button>
      </motion.div>
    );
  }, [isLoading, error, data, retryCount, name, fetchSummary]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoading || (!data?.success && retryCount < MAX_RETRIES) ? 'loading' : 'content'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CourseAISummary;

