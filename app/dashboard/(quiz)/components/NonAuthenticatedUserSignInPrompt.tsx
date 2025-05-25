"use client"

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/hooks/spinner";
import { selectAuthStatus, selectIsAuthenticated } from "@/store/slices/authSlice";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

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
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-6">
          <p className="text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col space-y-4">
          <Button
            onClick={handleSignIn}
            disabled={isLoading || loading}
            className="w-full"
            size="lg"
          >
            {isLoading || loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Your progress will be saved once you sign in.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-muted-foreground">
        <p>This helps us track your progress and save your results.</p>
      </CardFooter>
    </Card>
  );
};
