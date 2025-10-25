#!/bin/bash
echo "🎨 Checking Tailwind CSS for non-Neobrutal classes..."

echo -e "\n🔹 Hardcoded Tailwind colors:"
grep -RInE "class(Name)?=.*(bg-|text-|border-)\[#|bg-(red|blue|green|gray|yellow|purple|pink|indigo|emerald|sky|slate|zinc|neutral)-" ./app ./components | grep -v "var(--)"

echo -e "\n🔹 Non-brutal shadows:"
grep -RInE "shadow-(sm|md|lg|xl|2xl)" ./app ./components | grep -v "shadow-\["

echo -e "\n🔹 Inline style usage:"
grep -RIn "style={{" ./app ./components

echo -e "\n✅ Neobrutal Tailwind scan complete."
