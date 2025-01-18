import React from 'react';
import LandingComponent from './components/landing/LandingComponent';


const Dashboard = () => {
  return (
    <>
    
      {/* Main content area */}
      <div className="flex flex-col flex-grow">
        {/* Header taking full width */}
        
        
        {/* Main content and RightSidebar aligned next to each other */}
        <div className="flex flex-grow">
          <div className="flex-grow p-4">
            <LandingComponent />
          </div>
        
        </div>
      </div>
    </>
  );
};

export default Dashboard;
