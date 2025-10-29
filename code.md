import React from 'react';
import { Play, Menu, X, CheckCircle, Clock, TrendingUp, BookOpen, Award } from 'lucide-react';

// Mock components for demonstration
const Button = ({ children, className, ...props }) => (
  <button className={`px-4 py-2 font-black uppercase ${className}`} {...props}>
    {children}
  </button>
);

const Badge = ({ children, className }) => (
  <span className={`inline-block px-3 py-1 text-xs font-black uppercase border-2 border-black ${className}`}>
    {children}
  </span>
);

const ProgressRing = ({ percentage, size = 48 }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        className="text-gray-300 dark:text-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-green-600 dark:text-green-500 transition-all duration-500"
        strokeLinecap="round"
      />
    </svg>
  );
};

const FixedVideoLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [currentChapter, setCurrentChapter] = React.useState(0);
  
  // Mock data
  const course = {
    title: "Advanced React Patterns",
    totalVideos: 15,
    completedVideos: 5,
    progressPercentage: 33,
    totalDuration: "4h 30m"
  };

  const chapters = [
    { id: 1, title: "Introduction to Advanced Patterns", duration: "12:30", completed: true },
    { id: 2, title: "Higher-Order Components", duration: "18:45", completed: true },
    { id: 3, title: "Render Props Pattern", duration: "15:20", completed: false },
    { id: 4, title: "Custom Hooks Deep Dive", duration: "22:10", completed: false },
    { id: 5, title: "Context API Best Practices", duration: "16:55", completed: false },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white shadow-[0_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_4px_0px_0px_rgba(255,255,255,1)]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
            {/* Left: CourseAI Logo + Course Info */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* CourseAI Logo - Moved to top-left */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 dark:bg-yellow-500 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center">
                  <span className="text-black dark:text-white font-black text-xs sm:text-sm">CA</span>
                </div>
              </div>

              {/* Course Title */}
              <div className="flex-1 min-w-0">
                <h1 className="font-black uppercase tracking-tight truncate text-black dark:text-white text-base sm:text-xl">
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Play className="h-3 w-3 flex-shrink-0" />
                    <span>{course.totalVideos} videos</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{course.totalDuration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Mobile Menu + Progress */}
            <div className="flex items-center gap-2">
              {/* Progress Indicator - Hidden on mobile, shown on desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <ProgressRing percentage={course.progressPercentage} size={40} />
                <div className="text-xs font-bold">
                  <div className="text-black dark:text-white">{course.progressPercentage}%</div>
                  <div className="text-gray-600 dark:text-gray-400">{course.completedVideos}/{course.totalVideos}</div>
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden bg-blue-400 dark:bg-blue-600 hover:bg-blue-500 dark:hover:bg-blue-700 text-black dark:text-white border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="lg:hidden pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Progress</span>
              <span className="text-xs font-black text-black dark:text-white">{course.progressPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 border-2 border-black dark:border-white">
              <div 
                className="h-full bg-green-500 dark:bg-green-600 transition-all duration-300"
                style={{ width: `${course.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="lg:grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] lg:gap-6">
          {/* Video Player Section */}
          <div className="space-y-4">
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-gray-900 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 text-black dark:text-white fill-current ml-1" />
                </button>
              </div>
            </div>

            {/* Chapter Info - Single Clean Header */}
            <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-4">
              <h2 className="font-black text-lg sm:text-xl uppercase text-black dark:text-white">
                {chapters[currentChapter].title}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm font-bold text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{chapters[currentChapter].duration}</span>
                </div>
                {chapters[currentChapter].completed && (
                  <Badge className="bg-green-400 text-black border-black">
                    ✓ Completed
                  </Badge>
                )}
              </div>
            </div>

            {/* Tabs/Content Area */}
            <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-4">
              <div className="text-black dark:text-white">
                <h3 className="font-black text-lg uppercase mb-3">Course Details</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Tab content goes here...
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] sticky top-24">
              {/* Playlist Header */}
              <div className="p-4 border-b-4 border-black dark:border-white bg-yellow-400 dark:bg-yellow-500">
                <h3 className="font-black text-lg uppercase text-black">Course Content</h3>
                <p className="text-xs font-bold text-black/70 mt-1">{course.completedVideos}/{course.totalVideos} completed</p>
              </div>

              {/* Chapter List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setCurrentChapter(index)}
                    className={`w-full text-left p-4 border-b-2 border-black dark:border-white transition-colors ${
                      currentChapter === index
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center flex-shrink-0 font-black ${
                        chapter.completed ? 'bg-green-400 dark:bg-green-600' : 'bg-white dark:bg-gray-900'
                      }`}>
                        {chapter.completed ? <CheckCircle className="h-4 w-4 text-black dark:text-white" /> : <span className="text-black dark:text-white">{index + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm uppercase text-black dark:text-white line-clamp-2">{chapter.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{chapter.duration}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-900 border-l-4 border-black dark:border-white shadow-[8px_0px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_0px_0px_0px_rgba(255,255,255,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Playlist Header */}
            <div className="p-4 border-b-4 border-black dark:border-white bg-yellow-400 dark:bg-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg uppercase text-black">Course Content</h3>
                  <p className="text-xs font-bold text-black/70 mt-1">{course.completedVideos}/{course.totalVideos} completed</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 border-2 border-black flex items-center justify-center bg-white hover:bg-gray-100">
                  <X className="h-5 w-5 text-black" />
                </button>
              </div>
            </div>

            {/* Mobile Chapter List */}
            <div className="overflow-y-auto h-[calc(100vh-100px)]">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    setCurrentChapter(index);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-4 border-b-2 border-black dark:border-white transition-colors ${
                    currentChapter === index
                      ? 'bg-yellow-100 dark:bg-yellow-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center flex-shrink-0 font-black ${
                      chapter.completed ? 'bg-green-400 dark:bg-green-600' : 'bg-white dark:bg-gray-900'
                    }`}>
                      {chapter.completed ? <CheckCircle className="h-4 w-4 text-black dark:text-white" /> : <span className="text-black dark:text-white">{index + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm uppercase text-black dark:text-white line-clamp-2">{chapter.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{chapter.duration}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedVideoLayout;