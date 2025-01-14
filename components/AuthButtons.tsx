"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { AuthButton } from "./authButton";
import githubLogo from "../public/github.png";
import googleLogo from "../public/google.png";
import facebookLogo from "../public/facebook.png";

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

interface AuthButtonProps {
  callbackUrl: string;
}

export function GoogleSignInButton({ callbackUrl }: AuthButtonProps) {
  return (
    <Suspense fallback={<AuthButtonSkeleton />}>
      <motion.div variants={buttonVariants} custom={0} initial="hidden" animate="visible">
        <AuthButton provider="Google" logo={googleLogo} text="Sign in with Google" callbackUrl={callbackUrl} />
      </motion.div>
    </Suspense>
  );
}

export function GithubSignInButton({ callbackUrl }: AuthButtonProps) {
  return (
    <Suspense fallback={<AuthButtonSkeleton />}>
      <motion.div variants={buttonVariants} custom={1} initial="hidden" animate="visible">
        <AuthButton provider="Github" logo={githubLogo} text="Sign in with Github" callbackUrl={callbackUrl} />
      </motion.div>
    </Suspense>
  );
}

export function FacebookSignInButton({ callbackUrl }: AuthButtonProps) {
  return (
    <Suspense fallback={<AuthButtonSkeleton />}>
      <motion.div variants={buttonVariants} custom={2} initial="hidden" animate="visible">
        <AuthButton provider="Facebook" logo={facebookLogo} text="Sign in with Facebook" callbackUrl={callbackUrl} />
      </motion.div>
    </Suspense>
  );
}

export function CredentialsSignInButton({ callbackUrl }: AuthButtonProps) {
  return (
    <Suspense fallback={<AuthButtonSkeleton />}>
      <motion.div variants={buttonVariants} custom={3} initial="hidden" animate="visible">
        <AuthButton
          provider="credentials"
          logo="/email-icon.png"
          text="Continue with Email"
          callbackUrl={callbackUrl}
        />
      </motion.div>
    </Suspense>
  );
}

function AuthButtonSkeleton() {
  return (
    <div className="w-full h-12 mt-4 bg-gray-200 rounded-lg animate-pulse"></div>
  );
}
