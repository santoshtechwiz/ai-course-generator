import React from "react";
import { render } from "@testing-library/react";


// Mock the animation provider
jest.mock("@/providers/animation-provider", () => ({
  useAnimation: jest.fn().mockReturnValue({
    animationsEnabled: false,
    setAnimationsEnabled: jest.fn(),
  }),
}));

// Create a simple component that uses the animation provider
const TestComponent = () => {
  const { animationsEnabled } = useAnimation();
  return <div>{animationsEnabled ? "Animations On" : "Animations Off"}</div>;
};

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
export const MockAnimationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
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

describe("Animation Provider Mock", () => {
  test("should provide animation context with animations disabled by default", () => {
    const { getByText } = render(<TestComponent />);
    expect(getByText("Animations Off")).toBeInTheDocument();
  });
});
