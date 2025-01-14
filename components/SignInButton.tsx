"use client";
import React from "react";
import { Button } from "./ui/button";
import { signIn } from "next-auth/react";

type Props = {
  buttonText?: string;
};

const SignInButton = ({ buttonText = "Sign In" }: Props) => {
  return (
    <Button
      variant="default"
    
      size="sm"
      onClick={() => signIn()}
    >
      {buttonText}
    </Button> 
  );
};

export default SignInButton;
