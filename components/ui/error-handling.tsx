import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
    icon?: React.ReactNode;
  }>;
}

export function ErrorDisplay({
  title = "Something went wrong",
  message,
  actions,
}: ErrorDisplayProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-6 flex flex-col items-center text-center max-w-md mx-auto my-8">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {message}
      </p>
      
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-md font-medium ${
                action.variant === "outline" 
                  ? "border border-gray-300 text-gray-700 hover:bg-gray-50" 
                  : action.variant === "ghost"
                  ? "text-gray-700 hover:bg-gray-100"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
      
      {!actions && (
        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex items-center"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center"
            onClick={() => window.location.href = "/dashboard"}
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </button>
        </div>
      )}
    </div>
  );
}

// Empty state display
interface EmptyDisplayProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export function EmptyDisplay({
  title,
  message,
  action,
  icon,
}: EmptyDisplayProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800 p-8 flex flex-col items-center text-center max-w-md mx-auto my-8">
      {icon || <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-800 mb-4 flex items-center justify-center">
        <span className="text-2xl text-gray-400">?</span>
      </div>}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {message}
      </p>
      
      {action && (
        <button 
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
