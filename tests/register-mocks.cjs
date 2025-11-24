const Module = require('module');
const path = require('path');

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'expo-constants') {
    return path.join(__dirname, 'mocks/expo-constants.ts');
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
