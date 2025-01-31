import type { IconType } from "react-icons"
import {
    SiJavascript,
    SiPython,
    SiCss3,
    SiDotnet,
    SiCplusplus,
    SiRuby,
    SiGo,
    SiSwift,
    SiTypescript,
    SiPhp,
    SiRust,
    SiOpenjdk,

    SiKotlin,
    SiDart,
    SiScala,
    SiHaskell,
    SiElixir,
    SiLua,
    SiPerl,
    SiR,

} from "react-icons/si"

export interface Language {
    name: string
    icon: IconType
    category: string
}

export const languages: Language[] = [
    { name: "JavaScript", icon: SiJavascript, category: "Web" },
    { name: "Python", icon: SiPython, category: "General" },
    { name: "Java", icon: SiOpenjdk, category: "General" },
    { name: "C++", icon: SiCplusplus, category: "Systems" },
    { name: "Ruby", icon: SiRuby, category: "Web" },
    { name: "Go", icon: SiGo, category: "Systems" },
    { name: "Swift", icon: SiSwift, category: "Mobile" },
    { name: "TypeScript", icon: SiTypescript, category: "Web" },
    { name: "PHP", icon: SiPhp, category: "Web" },
    { name: "Rust", icon: SiRust, category: "Systems" },
    { name: "C#", icon: SiDotnet, category: "General" },
    { name: "Kotlin", icon: SiKotlin, category: "Mobile" },
    { name: "Dart", icon: SiDart, category: "Mobile" },
    { name: "Scala", icon: SiScala, category: "General" },
    { name: "Haskell", icon: SiHaskell, category: "Functional" },
    { name: "Elixir", icon: SiElixir, category: "Functional" },
    { name: "Lua", icon: SiLua, category: "Scripting" },
    { name: "Perl", icon: SiPerl, category: "Scripting" },
    { name: "R", icon: SiR, category: "Data Science" },

]

