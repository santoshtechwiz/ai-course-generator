import LandingComponent from "@/components/landing/LandingComponent";


const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-2 md:p-4">
      <LandingComponent />
      </div>
    </div>
  );
};

export default Dashboard;
