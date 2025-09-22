// Type declarations for react-syntax-highlighter
declare module 'react-syntax-highlighter' {
  import { ComponentType } from 'react';
  
  interface SyntaxHighlighterProps {
    children?: string;
    style?: any;
    language?: string;
    showLineNumbers?: boolean;
    customStyle?: React.CSSProperties;
    codeTagProps?: React.HTMLProps<HTMLElement>;
    PreTag?: ComponentType<any>;
    CodeTag?: ComponentType<any>;
    [key: string]: any;
  }
  
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/styles/vs' {
  const vs: any;
  export default vs;
}

declare module 'react-syntax-highlighter/dist/styles/prism' {
  export const vs: any;
  export const vscDarkPlus: any;
}