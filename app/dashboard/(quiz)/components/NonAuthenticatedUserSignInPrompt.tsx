"use client"

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/hooks/spinner";
import { selectAuthStatus, selectIsAuthenticated } from "@/store/slices/authSlice";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { LogIn, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

interface AuthPromptProps {
  onSignIn: () => void;
  title?: string;
  message?: string;
}

export const NonAuthenticatedUserSignInPrompt: React.FC<AuthPromptProps> = ({
  onSignIn,
  title = "Sign In Required",
  message = "Please sign in to view and save your quiz progress."
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { loading } = useSelector(selectAuthStatus); // ✅ now safe
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    setIsLoading(true);
    onSignIn();
  };

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto py-10"
    >
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center pb-6">
          <p className="text-muted-foreground mb-6">
            {message}
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-center pb-8">
          <Button 
            onClick={handleSignIn}
            disabled={isLoading || loading}
            size="lg" 
            className="min-w-[200px] gap-2"
          >
            {isLoading || loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
