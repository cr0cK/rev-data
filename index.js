#!/usr/bin/env node

// Write bytes received in stdin to a revved file path.
//
// Usage:
// cat node_modules/*/main.css | ./revved.js -f ./styles/modules-[hash].css

const md5 = require('md5');
const fs = require('fs');
const path = require('path');
const commander = require('commander');

const fileName = 'revved-[hash].file';

commander
  .option('-f, --filename <filename>', 'Default: ' + fileName, fileName)
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
  process.stdout.write(`Write data in "${hashedFileName}".\n\n`);
});
