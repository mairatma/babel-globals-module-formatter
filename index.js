'use strict';

var babel = require('babel');
var path = require('path');

var t = babel.types;

function GlobalsFormatter(file) {
  if (file.opts.filename === 'unknown') {
    throw new Error('The babel globals module formatter requires that filename be given');
  }

  this._filename = file.opts.filename;
  this._globalName = file.opts._globalName || 'es6Globals';
  this._sourceRoot = file.opts.sourceRoot || process.cwd();
}

GlobalsFormatter.prototype.transform = function (ast) {
  // this is ran after all transformers have had their turn at modifying the ast
  // feel free to modify this however
};

/**
 * Handles imports that don't store the results in variables. For example:
 * `import 'foo'`.
 * @param  {!ImportDeclaration} node
 * @param  {!Array} nodes
 */
GlobalsFormatter.prototype.importDeclaration = function (node, nodes) {
  // Just ignore this import, since the dependency code will already have been run.
};

GlobalsFormatter.prototype.importSpecifier = function (specifier, node, nodes) {
  if (t.isSpecifierDefault(specifier)) {
    // import foo from "foo";
    var id = this.getGlobalIdentifier(node.source.value);
    nodes.push(t.variableDeclaration('var', [
      t.variableDeclarator(specifier.local, id)
    ]));
  } else if (t.isImportNamespaceSpecifier(specifier)) {
    // import * as bar from "foo";
    console.log('wildcard import');
  } else {
    // import { foo } from "foo";
    console.log('named import');
  }
};

GlobalsFormatter.prototype.exportDeclaration = function (node, nodes) {
};

GlobalsFormatter.prototype.exportSpecifier = function (specifier, node, nodes) {
};

GlobalsFormatter.prototype.getGlobalIdentifier = function(filePath, name, isWildcard) {
  var globalName = this._globalName;
  if (name || isWildcard) {
    globalName += 'Named';
  }

  filePath = path.resolve(path.dirname(this._filename), filePath);
  var splitPath = filePath.split(path.sep);
  var moduleName = splitPath[splitPath.length - 1];

  var id = 'this.' + globalName + '.' + moduleName + (name ? '.' + name : '');

  return t.identifier(id);
};

module.exports = GlobalsFormatter;
