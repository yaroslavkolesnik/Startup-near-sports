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

    // Remove duplicate "import { theme } from '../theme';"
    let matches = content.match(/import \{ theme \} from '\.\.\/theme';/g);
    if (matches && matches.length > 1) {
        // Replace all but the first one
        let first = true;
        content = content.replace(/import \{ theme \} from '\.\.\/theme';\r?\n?/g, (match) => {
            if (first) {
                first = false;
                return match;
            }
            return '';
        });
        changed = true;
    }

    // Also check for '../../theme'
    let matches2 = content.match(/import \{ theme \} from '\.\.\/\.\.\/theme';/g);
    if (matches2 && matches2.length > 1) {
        let first2 = true;
        content = content.replace(/import \{ theme \} from '\.\.\/\.\.\/theme';\r?\n?/g, (match) => {
            if (first2) {
                first2 = false;
                return match;
            }
            return '';
        });
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Fixed duplicates in", file);
    }
});
