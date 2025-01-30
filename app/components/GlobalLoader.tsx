import React from "react";
import { Watch } from "react-loader-spinner";

interface GlobalLoaderProps {
  loading: boolean;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ loading }) => {
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-50">
        <Watch
          visible={true}
          height="80"
          width="80"
          radius="48"
          color="#4fa94d"
          ariaLabel="watch-loading"
        />
       
      </div>
    );
  }

  return null;
};
