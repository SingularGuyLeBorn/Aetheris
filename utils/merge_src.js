import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Script to merge all source files from the src directory into a single text file.
 * This is useful for code review, documentation, or LLM context.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');
const outputFile = path.resolve(__dirname, '../merged_code.txt');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let mergedContent = '';
let fileCount = 0;

console.log('Starting merge process...');

if (!fs.existsSync(srcDir)) {
    console.error(`Error: Source directory not found at ${srcDir}`);
    process.exit(1);
}

walkDir(srcDir, (filePath) => {
    // Only include text-based source files
    const ext = path.extname(filePath).toLowerCase();
    const allowedExts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.svg'];
    
    if (allowedExts.includes(ext)) {
        const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            mergedContent += `\n\n// =============================================================================\n`;
            mergedContent += `// FILE: ${relativePath}\n`;
            mergedContent += `// =============================================================================\n\n`;
            mergedContent += content;
            fileCount++;
            console.log(`Added: ${relativePath}`);
        } catch (err) {
            console.error(`Error reading file ${filePath}: ${err.message}`);
        }
    }
});

try {
    fs.writeFileSync(outputFile, mergedContent);
    console.log(`\nSuccess! Merged ${fileCount} files into: ${outputFile}`);
} catch (err) {
    console.error(`Error writing output file: ${err.message}`);
}
