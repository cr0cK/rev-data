#!/usr/bin/env node

// Write bytes received in stdin to a revved file path.
//
// Usage:
// cat node_modules/*/main.css | ./rev-data.js -f ./styles/modules-[hash].css -r ./styles/rev-manifest.json

const md5 = require('md5');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

const fileName = 'rev-data-[hash].file';
const revFileName = 'rev-manifest.json';

commander
  .option('-f, --filename <filename>', 'Output file. Default: ' + fileName, fileName)
  .option('-r, --manifest <filename>', 'Manifest file')
  .parse(process.argv);

process.stdout.write('Waiting data from stdin...\n');

process.stdin.resume();
process.stdin.setEncoding('utf8');

const timeID = setTimeout(() => {
  process.stdout.write('No data received from stdin!');
  commander.help();
  process.exit(1);
}, 2000);

process.stdin.on('data', function(data) {
  clearTimeout(timeID);

  const hash = md5(data).substr(0, 10);
  const hashedFileName = path.join(
    process.cwd(),
    commander.filename.replace('[hash]', hash)
  );
  fs.writeFileSync(hashedFileName, data, 'utf8');
  process.stdout.write(`Write data into "${hashedFileName}".\n`);

  // build manifest
  if (commander.manifest) {
    const manifest = { data: path.relative(process.cwd(), hashedFileName) };
    fs.writeFileSync(commander.manifest, JSON.stringify(manifest), 'utf8');
    process.stdout.write(`Write manifest into "${commander.manifest}".\n\n`);
  }
});
