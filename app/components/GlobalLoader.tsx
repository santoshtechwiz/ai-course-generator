import React from "react";
import { ThreeCircles } from "react-loader-spinner";

interface GlobalLoaderProps {
  loading: boolean;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ loading }) => {
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-50">
        <ThreeCircles
          visible={true}
          height="100"
          width="100"
          color="#4fa94d"
          ariaLabel="three-circles-loading"
          wrapperStyle={{}}
          wrapperClass=""
        />

      </div>
    );
  }

  return null;
};
