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
  } from "react-icons/si"
  
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
  ]
  
  const subtopics = {
    JavaScript: ["Promises", "ES6 Modules", "Async/Await", "DOM Manipulation", "Closures"],
    Python: ["List Comprehension", "Decorators", "Generators", "Context Managers", "OOP"],
    Java: ["Generics", "Multithreading", "Streams", "Lambda Expressions", "Spring Framework"],
    "C++": ["Templates", "STL", "Memory Management", "Move Semantics", "RAII"],
    Ruby: ["Blocks", "Metaprogramming", "Modules", "Rails", "Gems"],
    PHP: ["OOP", "Laravel", "Symfony", "Composer", "PSR Standards"],
    "C#": ["LINQ", "Async/Await", ".NET Core", "Entity Framework", "WPF"],
    Swift: ["Optionals", "Protocols", "Extensions", "SwiftUI", "Concurrency"],
    Go: ["Goroutines", "Channels", "Interfaces", "Error Handling", "Testing"],
    Rust: ["Ownership", "Borrowing", "Lifetimes", "Traits", "Concurrency"],
    TypeScript: ["Type Inference", "Generics", "Decorators", "Interfaces", "Enums"],
    Kotlin: ["Coroutines", "Data Classes", "Extension Functions", "Null Safety", "Android Development"],
  }
  
  export function getSubtopics(language: string): string[] {
    return subtopics[language as keyof typeof subtopics] || []
  }
  
  