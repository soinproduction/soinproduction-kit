import fs from 'node:fs';
const {version}=JSON.parse(fs.readFileSync('package.json','utf8'));
const tag=process.env.GITHUB_REF_NAME;
if(process.env.GITHUB_REF_TYPE!=='tag'||tag!==`v${version}`)throw new Error(`Publish requires tag v${version}; received ${tag??'no tag'}`);
console.log(`Release version: ${version}`);
