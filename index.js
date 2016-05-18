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
  .option('-a, --assetmanifest <filename>', 'Assets manifest file')
  .option('-p, --pathprefix <string>', 'Assets manifest file path prefix')
  .parse(process.argv);

process.stdout.write('Waiting data from stdin...\n');

process.stdin.resume();
process.stdin.setEncoding('utf8');

const timeID = setTimeout(() => {
  process.stdout.write('No data received from stdin!');
  commander.help();
  process.exit(1);
}, 2000);

function rewritePath(path) {
  if (!commander.pathprefix) return path;
  const re = new RegExp('^' + commander.pathprefix);
  return path.replace(re, '');
}

const rewrites = [];
if (commander.assetmanifest) {
  if (!fs.existsSync(commander.assetmanifest)) {
    process.stdout.write('assets manifests does not exists');
    process.exit(1);
  }

  const assetManifest = JSON.parse(fs.readFileSync(commander.assetmanifest));

  // sort paths from longest to shortest to avoid to replace sub paths
  // that could match
  const sortedPaths = Object.keys(assetManifest).sort((a, b) => {
    return a.length < b.length ? 1 : -1;
  })

  sortedPaths.forEach(function (key) {
    const orig = new RegExp(rewritePath(key), 'g');
    const dest = rewritePath(assetManifest[key]);

    rewrites.push(function(input) {
      return input.replace(orig, dest);
    });
  });
}

const dataParts = [];
process.stdin.on('data', function(data) {
  clearTimeout(timeID);
  dataParts.push(data);
});

process.stdin.on('end', function() {
  const data = dataParts.join('\n');
  const dataRewrited = rewrites.reduce(function (previousData, rewriter) {
    return rewriter(previousData);
  }, data);

  const hash = md5(dataRewrited).substr(0, 10);
  const hashedFileName = path.join(
    process.cwd(),
    commander.filename.replace('[hash]', hash)
  );
  fs.writeFileSync(hashedFileName, dataRewrited, 'utf8');
  process.stdout.write(`Write data into "${hashedFileName}".\n`);

  // build manifest
  if (commander.manifest) {
    const manifest = { data: path.relative(process.cwd(), hashedFileName) };
    fs.writeFileSync(commander.manifest, JSON.stringify(manifest), 'utf8');
    process.stdout.write(`Write manifest into "${commander.manifest}".\n\n`);
  }
});
