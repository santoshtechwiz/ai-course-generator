import React from "react";
import { DNA } from "react-loader-spinner";

interface GlobalLoaderProps {
  loading?: boolean;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = () => {
 return(
  <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-50">
      <DNA
        visible={true}
        height="80"
        width="80"
        ariaLabel="dna-loading"
        wrapperStyle={{}}
        wrapperClass="dna-wrapper"
      />
  </div>
 );
};
