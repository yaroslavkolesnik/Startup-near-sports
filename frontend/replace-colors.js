const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace import { colors } from '../theme/colors'; or similar
    if (content.includes("import { colors } from '../theme/colors';")) {
        content = content.replace(/import \{ colors \} from '\.\.\/theme\/colors';/g, "import { theme } from '../theme';");
        changed = true;
    } else if (content.includes("import { colors } from '../../theme/colors';")) {
        content = content.replace(/import \{ colors \} from '\.\.\/\.\.\/theme\/colors';/g, "import { theme } from '../../theme';");
        changed = true;
    }

    // Replace colors. with theme.colors. (excluding theme.colors.)
    // We can use a regex that looks for \bcolors\. and replaces with theme.colors.
    // Wait, what if it was already theme.colors. ?
    // A lookbehind for theme. would work, but we can also just replace \bcolors\. then fix theme.theme.colors.
    
    if (content.match(/\bcolors\./)) {
        content = content.replace(/\bcolors\./g, "theme.colors.");
        // fix any theme.theme.colors.
        content = content.replace(/theme\.theme\.colors\./g, "theme.colors.");
        changed = true;
    }
    
    // Check if the file now uses theme but doesn't import it
    if (content.includes('theme.colors') && !content.includes('theme')) {
        // Just print it for manual review
        console.log("Needs manual import:", file);
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Updated", file);
    }
});
