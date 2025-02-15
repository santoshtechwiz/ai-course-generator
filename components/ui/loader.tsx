import React from "react";
import { Watch } from "react-loader-spinner";

const PageLoader = () => {
  return (
    <div className="flex justify-center items-center h-screen w-full bg-background">
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
};

export default PageLoader;
