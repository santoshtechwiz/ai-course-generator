const fs = require('fs');
const path = require('path');

const svgFiles = [
    'generic-course-improved.svg',
    'generic-course-tech-improved.svg',
    'generic-course-business-improved.svg',
    'generic-course-creative-improved.svg'
];

console.log('🔍 Validating SVG files...\n');

svgFiles.forEach(file => {
    const filePath = path.join(__dirname, file);

    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for basic SVG structure
        const hasSvgTag = content.includes('<svg');
        const hasClosingSvgTag = content.includes('</svg>');
        const hasXmlns = content.includes('xmlns="http://www.w3.org/2000/svg"');
        const hasInvalidContentTag = content.includes('</content>');

        console.log(`📄 ${file}:`);
        console.log(`  ✅ Has SVG opening tag: ${hasSvgTag}`);
        console.log(`  ✅ Has SVG closing tag: ${hasClosingSvgTag}`);
        console.log(`  ✅ Has XML namespace: ${hasXmlns}`);
        console.log(`  ❌ Has invalid content tag: ${hasInvalidContentTag}`);

        if (hasSvgTag && hasClosingSvgTag && hasXmlns && !hasInvalidContentTag) {
            console.log(`  🎉 VALID SVG FILE\n`);
        } else {
            console.log(`  ❌ INVALID SVG FILE\n`);
        }

    } catch (error) {
        console.log(`❌ Error reading ${file}: ${error.message}\n`);
    }
});

console.log('✨ SVG validation complete!');
