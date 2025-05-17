import React from "react";

// Define the expected context type
interface AnimationContextType {
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  toggleAnimations: () => void;
}

// Create a mock AnimationContext
export const AnimationContext = React.createContext<AnimationContextType>({
  animationsEnabled: false,
  setAnimationsEnabled: () => {},
  toggleAnimations: () => {},
});

// Export a mock hook that components can use in test environment
export const useAnimation = () => React.useContext(AnimationContext);

// Create a MockAnimationProvider for tests
export const MockAnimationProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AnimationContext.Provider
      value={{
        animationsEnabled: false,
        setAnimationsEnabled: () => {},
        toggleAnimations: () => {},
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};
