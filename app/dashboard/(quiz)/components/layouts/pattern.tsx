import { PenTool, StickyNote, BookOpen, Code2, Brain } from "lucide-react";

export const patterns: Record<string, React.ReactNode> = {
    blanks: (
      <g>
        <defs>
          <linearGradient
            id="fillBlanksGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect
          x="10"
          y="15"
          width="30"
          height="3"
          rx="1.5"
          fill="url(#fillBlanksGrad)"
        />
        <rect
          x="45"
          y="15"
          width="20"
          height="3"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <rect
          x="70"
          y="15"
          width="25"
          height="3"
          rx="1.5"
          fill="url(#fillBlanksGrad)"
        />
        <rect
          x="10"
          y="25"
          width="25"
          height="3"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <rect
          x="40"
          y="25"
          width="35"
          height="3"
          rx="1.5"
          fill="url(#fillBlanksGrad)"
        />
        <rect
          x="10"
          y="35"
          width="40"
          height="3"
          rx="1.5"
          fill="url(#fillBlanksGrad)"
        />
        <rect
          x="55"
          y="35"
          width="15"
          height="3"
          rx="1.5"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <rect
          x="75"
          y="35"
          width="20"
          height="3"
          rx="1.5"
          fill="url(#fillBlanksGrad)"
        />
      </g>
    ),
    flashcard: (
      <g>
        <defs>
          <linearGradient
            id="flashcardGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <rect
          x="15"
          y="15"
          width="25"
          height="18"
          rx="3"
          fill="url(#flashcardGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect
          x="45"
          y="20"
          width="25"
          height="18"
          rx="3"
          fill="url(#flashcardGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect
          x="75"
          y="25"
          width="25"
          height="18"
          rx="3"
          fill="url(#flashcardGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
      </g>
    ),
    openended: (
      <g>
        <defs>
          <linearGradient
            id="openendedGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M15,20 Q30,15 45,20 T75,20"
          stroke="url(#openendedGrad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M15,30 Q35,25 55,30 T85,30"
          stroke="url(#openendedGrad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M15,40 Q25,35 35,40 T65,40"
          stroke="url(#openendedGrad)"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="25" cy="30" r="1.5" fill="currentColor" fillOpacity="0.2" />
        <circle cx="30" cy="40" r="1.5" fill="currentColor" fillOpacity="0.2" />
      </g>
    ),
    code: (
      <g>
        <defs>
          <linearGradient id="codeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect x="15" y="18" width="8" height="3" rx="1" fill="url(#codeGrad)" />
        <rect
          x="26"
          y="18"
          width="20"
          height="3"
          rx="1"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <rect
          x="49"
          y="18"
          width="12"
          height="3"
          rx="1"
          fill="url(#codeGrad)"
        />
        <rect x="20" y="25" width="6" height="3" rx="1" fill="url(#codeGrad)" />
        <rect
          x="29"
          y="25"
          width="25"
          height="3"
          rx="1"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <rect
          x="25"
          y="32"
          width="15"
          height="3"
          rx="1"
          fill="url(#codeGrad)"
        />
        <rect
          x="43"
          y="32"
          width="18"
          height="3"
          rx="1"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <rect
          x="20"
          y="39"
          width="10"
          height="3"
          rx="1"
          fill="url(#codeGrad)"
        />
        <path
          d="M70,20 L75,25 L70,30"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M80,20 L85,25 L80,30"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1.5"
          fill="none"
        />
      </g>
    ),
    mcq: (
      <g>
        <defs>
          <linearGradient id="mcqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r="3"
          fill="url(#mcqGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect
          x="28"
          y="17"
          width="25"
          height="2"
          rx="1"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <rect
          x="28"
          y="21"
          width="20"
          height="2"
          rx="1"
          fill="currentColor"
          fillOpacity="0.08"
        />
        <circle
          cx="20"
          cy="35"
          r="3"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect
          x="28"
          y="32"
          width="30"
          height="2"
          rx="1"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <rect
          x="28"
          y="36"
          width="22"
          height="2"
          rx="1"
          fill="currentColor"
          fillOpacity="0.08"
        />
        <circle
          cx="20"
          cy="50"
          r="3"
          fill="url(#mcqGrad)"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
        <rect
          x="28"
          y="47"
          width="28"
          height="2"
          rx="1"
          fill="currentColor"
          fillOpacity="0.1"
        />
        <rect
          x="28"
          y="51"
          width="18"
          height="2"
          rx="1"
          fill="currentColor"
          fillOpacity="0.08"
        />
      </g>
    ),
  };


export const quizTypeColors = {
  blanks: {
    badge:
      "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/25",
    icon: "text-blue-500",
    pattern: "text-blue-400",
    glow: "shadow-blue-500/20",
    hover: "hover:shadow-blue-500/30",
  },
  flashcard: {
    badge:
      "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg shadow-orange-500/25",
    icon: "text-orange-500",
    pattern: "text-orange-400",
    glow: "shadow-orange-500/20",
    hover: "hover:shadow-orange-500/30",
  },
  openended: {
    badge:
      "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg shadow-purple-500/25",
    icon: "text-purple-500",
    pattern: "text-purple-400",
    glow: "shadow-purple-500/20",
    hover: "hover:shadow-purple-500/30",
  },
  code: {
    badge:
      "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/25",
    icon: "text-green-500",
    pattern: "text-green-400",
    glow: "shadow-green-500/20",
    hover: "hover:shadow-green-500/30",
  },
  mcq: {
    badge:
      "bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0 shadow-lg shadow-indigo-500/25",
    icon: "text-indigo-500",
    pattern: "text-indigo-400",
    glow: "shadow-indigo-500/20",
    hover: "hover:shadow-indigo-500/30",
  },
};

// Enhanced difficulty colors with gradients
export const difficultyColors = {
  Easy: "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-0 shadow-md shadow-emerald-500/20",
  Medium:
    "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md shadow-amber-500/20",
  Hard: "bg-gradient-to-r from-rose-400 to-red-500 text-white border-0 shadow-md shadow-rose-500/20",
};

export const quizTypeRoutes = {
  blanks: "dashboard/blanks",
  mcq: "dashboard/mcq",
  flashcard: "dashboard/flashcard",
  openended: "dashboard/openended",
  code: "dashboard/code",
};

export const quizTypeIcons = {
  blanks: PenTool,
  flashcard: StickyNote,
  openended: BookOpen,
  code: Code2,
  mcq: Brain,
};

export const quizTypeLabels = {
  blanks: "Fill Blanks",
  flashcard: "Flashcards",
  openended: "Open Ended",
  code: "Code Quiz",
  mcq: "Multiple Choice",
};
