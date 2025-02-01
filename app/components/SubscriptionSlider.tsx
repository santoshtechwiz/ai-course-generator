"use client"

import { Slider } from "@/components/ui/slider"; // Adjust the import based on your UI library
import useSubscriptionStore from "@/store/useSubscriptionStore";


interface SubscriptionSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  ariaLabel?: string;
}

export const SubscriptionSlider = ({
  value,
  onValueChange,
  ariaLabel = "Select number of questions",
}: SubscriptionSliderProps) => {
  const { subscriptionStatus } = useSubscriptionStore();

  // Determine the max value based on the subscription type
  const getMaxQuestions = () => {
    switch (subscriptionStatus?.subscriptionPlan) {
      case "FREE":
        return 3;
      case "BASIC":
        return 5; 
      case "PRO":
        return 15; 
      default:
        return 3; 
    }
  };

  const maxQuestions = getMaxQuestions();

  return (
   <>
    <Slider
      id="questionCount"
      min={1}
      max={maxQuestions}
      step={1}
      value={[value]}
      onValueChange={(values) => onValueChange(values[0])}
      className="flex-grow"
      aria-label={ariaLabel}
    />
    {maxQuestions}
   </>
  );
};