import React, { ReactNode } from "react";
import { Watch } from "react-loader-spinner";

interface ApiLoaderProps {
  loading: boolean;
  
}

export const ApiLoader: React.FC<ApiLoaderProps> = ({ loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Watch
          visible={true}
          height="80"
          width="80"
          radius="48"
          color="#4fa94d"
          ariaLabel="watch-loading"
        />
        {/* show toast */}
        
      </div>
    );
  }

  return <></>;
};
