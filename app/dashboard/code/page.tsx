
import CodeGenerator from "./_components/Code";

const Page=async ()=>{
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar with fixed width and full height */}
      {/* <Sidebar /> */}

      {/* Main content area */}
      <div className="flex flex-col flex-grow">
        {/* Header taking full width */}
       

        {/* Main content and RightSidebar aligned next to each other */}
        <div className="flex flex-grow">
          <div className="flex-grow p-4">
           <CodeGenerator/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;