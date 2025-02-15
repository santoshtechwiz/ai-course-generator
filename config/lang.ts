import {
  SiJavascript,
  SiPython,
  SiOpenjdk,
  SiCplusplus,
  SiRuby,
  SiPhp,
  SiDotnet,
  SiSwift,
  SiGo,
  SiRust,
  SiTypescript,
  SiKotlin,
  SiHtml5,
  SiCss3,
  SiMysql,
} from "react-icons/si";

export const languages = [
  { name: "JavaScript", icon: SiJavascript, category: "Web Development" },
  { name: "Python", icon: SiPython, category: "General Purpose" },
  { name: "Java", icon: SiOpenjdk, category: "General Purpose" },
  { name: "C++", icon: SiCplusplus, category: "Systems Programming" },
  { name: "Ruby", icon: SiRuby, category: "Web Development" },
  { name: "PHP", icon: SiPhp, category: "Web Development" },
  { name: "C#", icon: SiDotnet, category: "General Purpose" },
  { name: "Swift", icon: SiSwift, category: "Mobile Development" },
  { name: "Go", icon: SiGo, category: "Systems Programming" },
  { name: "Rust", icon: SiRust, category: "Systems Programming" },
  { name: "TypeScript", icon: SiTypescript, category: "Web Development" },
  { name: "Kotlin", icon: SiKotlin, category: "Mobile Development" },
  { name: "HTML", icon: SiHtml5, category: "Web Development" },
  { name: "CSS", icon: SiCss3, category: "Web Development" },
  { name: "SQL", icon: SiMysql, category: "Database Management" },
];

const subtopics = {
  JavaScript: ["Promises", "ES6 Modules", "Async/Await", "DOM Manipulation", "Closures", "Event Loop", "Hoisting", "Prototype Inheritance"],
  Python: ["List Comprehension", "Decorators", "Generators", "Context Managers", "OOP", "Flask", "Django", "NumPy"],
  Java: ["Generics", "Multithreading", "Streams", "Lambda Expressions", "Spring Framework", "JVM Internals", "Garbage Collection", "Design Patterns"],
  "C++": ["Templates", "STL", "Memory Management", "Move Semantics", "RAII", "Pointers", "Multithreading", "Smart Pointers"],
  Ruby: ["Blocks", "Metaprogramming", "Modules", "Rails", "Gems", "ActiveRecord", "Monkey Patching"],
  PHP: ["OOP", "Laravel", "Symfony", "Composer", "PSR Standards", "WordPress Development", "Security Best Practices"],
  "C#": ["LINQ", "Async/Await", ".NET Core", "Entity Framework", "WPF", "Blazor", "Delegates", "Events"],
  Swift: ["Optionals", "Protocols", "Extensions", "SwiftUI", "Concurrency", "Memory Management", "Combine Framework"],
  Go: ["Goroutines", "Channels", "Interfaces", "Error Handling", "Testing", "Concurrency Patterns", "Dependency Management"],
  Rust: ["Ownership", "Borrowing", "Lifetimes", "Traits", "Concurrency", "Memory Safety", "Cargo"],
  TypeScript: ["Type Inference", "Generics", "Decorators", "Interfaces", "Enums", "Utility Types", "Type Guards"],
  Kotlin: ["Coroutines", "Data Classes", "Extension Functions", "Null Safety", "Android Development", "Kotlin Multiplatform", "Jetpack Compose"],
  HTML: ["Semantic Elements", "Forms", "Canvas", "Web Components", "SEO Best Practices"],
  CSS: ["Flexbox", "Grid", "Animations", "SASS", "CSS Variables", "Tailwind CSS"],
  SQL: ["Joins", "Stored Procedures", "Indexing", "Normalization", "Transactions", "Views", "Triggers", "Performance Optimization"],
};
  
  export function getSubtopics(language: string): string[] {
    return subtopics[language as keyof typeof subtopics] || []
  }
  
  