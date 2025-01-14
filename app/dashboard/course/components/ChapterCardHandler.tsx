"use client";

import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo } from "react";
import { Loader2, CheckCircle, PlayCircle } from 'lucide-react';
import { Chapter } from "@prisma/client";
import { useChapterProcessing } from "@/hooks/useChapterProcessing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  chapter: Chapter;
  chapterIndex: number;
  completedChapters: Set<number>;
  setCompletedChapters: React.Dispatch<React.SetStateAction<Set<number>>>;
  allChaptersCompleted: boolean;
  onSaveAndContinue: () => void;
};

export type ChapterCardHandler = {
  triggerLoad: () => void;
};

const ChapterCard = React.memo(React.forwardRef<ChapterCardHandler, Props>(
  (
    { chapter, chapterIndex, setCompletedChapters, completedChapters, allChaptersCompleted, onSaveAndContinue },
    ref
  ) => {
    const { state, triggerProcessing } = useChapterProcessing(chapter);

    const addChapterToCompleted = useCallback(() => {
      setCompletedChapters(prev => new Set(prev).add(chapter.id));
    }, [chapter.id, setCompletedChapters]);

    useEffect(() => {
      if (state.videoStatus === 'success') {
        addChapterToCompleted();
      }
    }, [state.videoStatus, addChapterToCompleted]);

    React.useImperativeHandle(ref, () => ({
      triggerLoad: triggerProcessing,
    }));

    const { isProcessing, isSuccess, isError } = useMemo(() => ({
      isProcessing: state.videoStatus === 'processing',
      isSuccess: state.videoStatus === 'success',
      isError: state.videoStatus === 'error',
    }), [state]);

    const cardClassName = useMemo(() => 
      cn(
        "transition-all duration-300",
        {
          "bg-secondary": !isSuccess && !isError,
          "border-red-300 bg-red-50": isError,
          "border-green-300 bg-green-50": isSuccess,
        }
      ), [isSuccess, isError]);

    return (
      <Card className={cardClassName}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Chapter {chapterIndex + 1}: {chapter.name}</span>
            {isSuccess && <CompletionIcon />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <StatusIndicator icon={PlayCircle} label="Video" status={state.videoStatus} />
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <ActionButton
            isSuccess={isSuccess}
            isProcessing={isProcessing}
            triggerProcessing={triggerProcessing}
            onSaveAndContinue={onSaveAndContinue}
          />
        </CardFooter>
      </Card>
    );
  }
));

ChapterCard.displayName = "ChapterCard";

const CompletionIcon: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <CheckCircle className="h-5 w-5 text-green-600" />
      </TooltipTrigger>
      <TooltipContent>
        <p>Chapter completed</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface ActionButtonProps {
  isSuccess: boolean;
  isProcessing: boolean;
  triggerProcessing: () => void;
  onSaveAndContinue: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(({ isSuccess, isProcessing, triggerProcessing, onSaveAndContinue }) => {
  if (isSuccess) {
    return (
      <Button
        onClick={onSaveAndContinue}
        variant="outline"
        className="w-full sm:w-auto"
      >
        Save & Continue
      </Button>
    );
  }

  if (isProcessing) {
    return (
      <Button
        disabled
        variant="secondary"
        className="w-full sm:w-auto"
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Processing...
      </Button>
    );
  }

  return (
    <Button
      onClick={triggerProcessing}
      className="w-full sm:w-auto"
    >
      Generate
    </Button>
  );
});

ActionButton.displayName = "ActionButton";

const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(({ icon: Icon, label, status }) => {
  const iconClassName = useMemo(() => 
    cn(
      "h-5 w-5",
      {
        "text-muted-foreground": status === 'idle',
        "text-blue-600 animate-pulse": status === 'processing',
        "text-green-600": status === 'success',
        "text-red-600": status === 'error',
      }
    ), [status]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center space-x-2">
          <Icon className={iconClassName} />
          <span className="text-sm font-medium">{label}:</span>
          <span className="text-sm text-muted-foreground capitalize">{status}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusDescription(status)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

StatusIndicator.displayName = "StatusIndicator";

interface StatusIndicatorProps {
  icon: React.ElementType;
  label: string;
  status: 'idle' | 'processing' | 'success' | 'error';
}

function getStatusDescription(status: 'idle' | 'processing' | 'success' | 'error'): string {
  switch (status) {
    case 'idle':
      return 'Ready to generate';
    case 'processing':
      return 'Generation in progress';
    case 'success':
      return 'Successfully generated';
    case 'error':
      return 'Error during generation';
  }
}

export default ChapterCard;
