'use client';
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ isOpen, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="p-6 max-w-md w-full bg-card rounded-lg shadow-lg">
        <AlertDialogHeader className="mb-4">
          <AlertDialogTitle className="text-2xl font-bold text-foreground">Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-muted-foreground">
            This will start the chapter generation process. It may take a while to complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-end space-x-4">
          <AlertDialogCancel onClick={onCancel} className="btn btn-outline">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="btn btn-primary">Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

