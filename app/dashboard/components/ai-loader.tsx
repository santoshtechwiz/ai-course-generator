export function AILoader() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        className="stroke-primary"
      >
        <g fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Neural Network Animation */}
          <circle className="animate-pulse" cx="50" cy="50" r="20" />
          <circle className="animate-pulse delay-150" cx="20" cy="30" r="8" />
          <circle className="animate-pulse delay-300" cx="80" cy="30" r="8" />
          <circle className="animate-pulse delay-150" cx="20" cy="70" r="8" />
          <circle className="animate-pulse delay-300" cx="80" cy="70" r="8" />
          
          {/* Connecting Lines */}
          <path 
            className="animate-dash" 
            d="M28 30L42 50M72 30L58 50M28 70L42 50M72 70L58 50"
            strokeDasharray="30"
            strokeDashoffset="30"
          />
          
          {/* Pulse Rings */}
          <circle 
            className="animate-ripple opacity-0" 
            cx="50" 
            cy="50" 
            r="35"
          />
          <circle 
            className="animate-ripple delay-300 opacity-0" 
            cx="50" 
            cy="50" 
            r="35"
          />
        </g>
      </svg>
    );
  }
  
  