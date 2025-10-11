'use client';

import React, { useEffect, useState } from 'react';
import { useContextPreservation } from '@/hooks/useContextPreservation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';

/**
 * Migration Welcome Component
 * Shows a contextual welcome message after successful guest state migration
 * SSR-safe with hydration guards
 */
export function MigrationWelcome() {
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    migrationWelcome,
    handleDismissMigrationWelcome,
    getWelcomeMessage,
    executeIntent,
    intentContext
  } = useContextPreservation();
  
  // Prevent SSR/hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Don't render until mounted (SSR guard)
  if (!isMounted) {
    return null;
  }
  
  const welcomeData = getWelcomeMessage();
  
  if (!migrationWelcome?.show || !welcomeData) {
    return null;
  }
  
  const handleContinue = async () => {
    // Execute stored intent if available, otherwise dismiss
    if (intentContext) {
      await executeIntent();
    } else {
      await handleDismissMigrationWelcome();
    }
  };
  
  const handleDismiss = async () => {
    await handleDismissMigrationWelcome();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-green-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {welcomeData.title}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            {welcomeData.message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleContinue}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {intentContext ? (
                <>
                  Continue Where I Left Off
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                'Get Started'
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleDismiss}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}