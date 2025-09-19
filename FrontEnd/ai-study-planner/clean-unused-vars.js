#!/usr/bin/env node
/**
 * Script to identify and remove unused variables in React files
 * This script scans all JavaScript/JSX files and identifies unused variables
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const SRC_DIR = path.join(__dirname, 'src');
const IGNORE_PATTERNS = [
  'node_modules',
  'build',
  'dist',
  '.git',
  'reportWebVitals.js',
  'setupTests.js'
];

// Common patterns for unused variables
const UNUSED_PATTERNS = [
  // Import patterns
  /import\s+{\s*([^}]*)\s*}\s+from/g,
  // Destructuring patterns
  /const\s+{\s*([^}]*)\s*}\s*=/g,
  /let\s+{\s*([^}]*)\s*}\s*=/g,
  // Variable declarations
  /const\s+(\w+)\s*=/g,
  /let\s+(\w+)\s*=/g,
  /var\s+(\w+)\s*=/g,
];

class UnusedVariableCleaner {
  constructor() {
    this.results = {
      filesScanned: 0,
      unusedFound: 0,
      filesModified: 0,
      unusedVariables: []
    };
  }

  // Get all JavaScript/JSX files recursively
  getAllFiles(dir = SRC_DIR) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!IGNORE_PATTERNS.some(pattern => item.includes(pattern))) {
          files = files.concat(this.getAllFiles(fullPath));
        }
      } else if (FILE_EXTENSIONS.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  // Parse imports and extract variable names
  parseImports(content) {
    const imports = [];
    const importRegex = /import\s+(?:(?:\w+|\{[^}]+\}|\*\s+as\s+\w+)(?:\s*,\s*(?:\{[^}]+\}|\w+))*)\s+from\s+['"'][^'"]+['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importStatement = match[0];
      
      // Extract named imports
      const namedImportMatch = importStatement.match(/\{([^}]+)\}/);
      if (namedImportMatch) {
        const namedImports = namedImportMatch[1]
          .split(',')
          .map(imp => imp.trim().split(/\s+as\s+/).pop().trim())
          .filter(imp => imp);
        imports.push(...namedImports);
      }
      
      // Extract default imports
      const defaultImportMatch = importStatement.match(/import\s+(\w+)/);
      if (defaultImportMatch && !importStatement.includes('{')) {
        imports.push(defaultImportMatch[1]);
      }
    }
    
    return imports;
  }

  // Parse variable declarations
  parseVariableDeclarations(content) {
    const variables = [];
    
    // Const, let, var declarations
    const varRegex = /(?:const|let|var)\s+(\w+)(?:\s*=|;)/g;
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      variables.push(match[1]);
    }
    
    // Destructured variables
    const destructureRegex = /(?:const|let|var)\s+\{\s*([^}]+)\s*\}/g;
    while ((match = destructureRegex.exec(content)) !== null) {
      const destructured = match[1]
        .split(',')
        .map(v => v.trim().split(':')[0].trim())
        .filter(v => v && v !== '...');
      variables.push(...destructured);
    }
    
    return variables;
  }

  // Check if variable is used in the content
  isVariableUsed(variableName, content, excludeDeclaration = true) {
    if (!variableName || variableName.length < 2) return true;
    
    // Create regex to find variable usage (not declaration)
    const usageRegex = new RegExp(
      `(?<!(?:const|let|var|import|function|class)\\s+(?:\\w+\\s+)*?)\\b${variableName}\\b(?!\\s*[=:]\\s*(?:function|class|=>))`,
      'g'
    );
    
    const matches = content.match(usageRegex) || [];
    
    if (excludeDeclaration) {
      // Remove declaration matches
      const declarationRegex = new RegExp(
        `(?:const|let|var|import.*?)\\s+.*?\\b${variableName}\\b`,
        'g'
      );
      const declarationMatches = content.match(declarationRegex) || [];
      return matches.length > declarationMatches.length;
    }
    
    return matches.length > 1; // More than just the declaration
  }

  // Remove unused import
  removeUnusedImport(content, unusedImport) {
    // Handle named imports
    const namedImportRegex = new RegExp(`\\{([^}]*?)\\b${unusedImport}\\b(\\s*,\\s*)?([^}]*?)\\}`, 'g');
    let newContent = content.replace(namedImportRegex, (match, before, comma, after) => {
      const beforeClean = before.replace(/,\s*$/, '').trim();
      const afterClean = after.replace(/^\s*,/, '').trim();
      
      if (!beforeClean && !afterClean) {
        return ''; // Remove entire import if this was the only import
      } else if (!beforeClean) {
        return `{${afterClean}}`;
      } else if (!afterClean) {
        return `{${beforeClean}}`;
      } else {
        return `{${beforeClean}, ${afterClean}}`;
      }
    });

    // Remove empty import statements
    newContent = newContent.replace(/import\s+\{\s*\}\s+from\s+['"'][^'"]+['"'];?\n?/g, '');
    newContent = newContent.replace(/import\s+from\s+['"'][^'"]+['"'];?\n?/g, '');

    return newContent;
  }

  // Remove unused variable declaration
  removeUnusedVariable(content, unusedVar) {
    // Remove from destructuring
    const destructureRegex = new RegExp(
      `((?:const|let|var)\\s+\\{[^}]*?)\\b${unusedVar}\\b(\\s*,\\s*)?([^}]*?\\})`,
      'g'
    );
    let newContent = content.replace(destructureRegex, (match, before, comma, after) => {
      const cleanBefore = before.replace(/,\s*$/, '');
      const cleanAfter = after.replace(/^\s*,/, '');
      
      if (cleanBefore.endsWith('{') && cleanAfter === '}') {
        return ''; // Remove entire line if this was the only variable
      } else {
        return cleanBefore + (cleanAfter !== '}' && !cleanBefore.endsWith('{') ? ', ' : '') + cleanAfter;
      }
    });

    // Remove standalone variable declarations
    const standaloneRegex = new RegExp(`(?:const|let|var)\\s+${unusedVar}\\s*=.*?;\\n?`, 'g');
    newContent = newContent.replace(standaloneRegex, '');

    return newContent;
  }

  // Process a single file
  processFile(filePath) {
    try {
      this.results.filesScanned++;
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      let newContent = content;
      let fileModified = false;
      const fileUnused = [];

      // Get all imports and variables
      const imports = this.parseImports(content);
      const variables = this.parseVariableDeclarations(content);
      const allVariables = [...new Set([...imports, ...variables])];

      // Check each variable for usage
      for (const variable of allVariables) {
        if (!this.isVariableUsed(variable, content)) {
          this.results.unusedFound++;
          fileUnused.push(variable);
          
          // Try to remove unused import
          const contentAfterImportRemoval = this.removeUnusedImport(newContent, variable);
          if (contentAfterImportRemoval !== newContent) {
            newContent = contentAfterImportRemoval;
            fileModified = true;
          } else {
            // Try to remove unused variable
            const contentAfterVarRemoval = this.removeUnusedVariable(newContent, variable);
            if (contentAfterVarRemoval !== newContent) {
              newContent = contentAfterVarRemoval;
              fileModified = true;
            }
          }
        }
      }

      if (fileModified) {
        this.results.filesModified++;
        this.results.unusedVariables.push({
          file: relativePath,
          variables: fileUnused
        });
        
        // Write the cleaned content back to file
        fs.writeFileSync(filePath, newContent);
      }

      return {
        file: relativePath,
        unusedCount: fileUnused.length,
        modified: fileModified,
        unusedVariables: fileUnused
      };

    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error.message);
      return null;
    }
  }

  // Main cleaning function
  async clean() {
    console.log('🧹 Starting unused variable cleanup...\n');
    
    const files = this.getAllFiles();
    const results = [];

    for (const file of files) {
      const result = this.processFile(file);
      if (result && result.unusedCount > 0) {
        results.push(result);
        console.log(`✅ ${result.file}: Removed ${result.unusedCount} unused variable(s)`);
        result.unusedVariables.forEach(variable => {
          console.log(`   - ${variable}`);
        });
      }
    }

    // Print summary
    console.log('\n📊 Cleanup Summary:');
    console.log('='.repeat(50));
    console.log(`Files scanned: ${this.results.filesScanned}`);
    console.log(`Files modified: ${this.results.filesModified}`);
    console.log(`Total unused variables removed: ${this.results.unusedFound}`);
    
    if (this.results.unusedVariables.length > 0) {
      console.log('\n📝 Modified Files:');
      this.results.unusedVariables.forEach(item => {
        console.log(`  ${item.file}:`);
        item.variables.forEach(variable => {
          console.log(`    - ${variable}`);
        });
      });
    }

    console.log('\n✨ Cleanup completed!');
    return this.results;
  }
}

// Run the cleaner if this script is executed directly
if (require.main === module) {
  const cleaner = new UnusedVariableCleaner();
  cleaner.clean().catch(console.error);
}

module.exports = UnusedVariableCleaner;
