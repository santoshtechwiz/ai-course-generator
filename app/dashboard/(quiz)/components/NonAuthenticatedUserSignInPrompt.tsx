"use client"

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, UserPlus, ExternalLink } from "lucide-react";

interface NonAuthenticatedUserSignInPromptProps {
  onSignIn: () => void;
  title: string;
  message: string;
  fallbackAction?: {
    label: string;
    onClick: () => void;
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null;
  };
}

export function NonAuthenticatedUserSignInPrompt({
  onSignIn,
  title,
  message,
  fallbackAction,
}: NonAuthenticatedUserSignInPromptProps) {
  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-xl sm:text-2xl text-center font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <div className="text-center mb-6">
          <div className="bg-primary/10 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-6">{message}</p>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg border border-muted my-6">
          <h3 className="font-medium mb-3">Benefits of signing in:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>View detailed quiz results and explanations</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Save your progress and track improvement</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Access premium content and features</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Get personalized learning recommendations</span>
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-0 pb-6">
        <Button className="w-full sm:w-auto" size="lg" onClick={onSignIn}>
          Sign In
        </Button>
        {fallbackAction && (
          <Button
            className="w-full sm:w-auto"
            variant={fallbackAction.variant || "outline"}
            size="lg"
            onClick={fallbackAction.onClick}
          >
            {fallbackAction.label}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
