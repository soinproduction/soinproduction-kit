import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const metadata=JSON.parse(fs.readFileSync('package.json','utf8'));
const [packed]=JSON.parse(execFileSync('npm',['pack','--dry-run','--ignore-scripts','--json'],{encoding:'utf8'}));
const files=new Set(packed.files.map(file=>file.path));
function verify(value){
 if(typeof value==='object'){for(const entry of Object.values(value))verify(entry);return;}
 const target=value.replace(/^\.\//,'');
 if(target.includes('*')){const pattern=new RegExp('^'+target.split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$');assert.ok([...files].some(file=>pattern.test(file)),`No packed files for export ${value}`);}
 else assert.ok(files.has(target),`Missing packed export: ${value}`);
}
verify(metadata.exports);
assert.ok(files.has('dist/index.js'));
assert.ok(files.has('docs/publishing.md'));
assert.ok(![...files].some(file=>/^(?:node_modules|tooling|\.github)\//.test(file)));
console.log(`Verified all public exports in ${files.size} packed files.`);
