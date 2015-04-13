'use strict';

var babel = require('babel');
var path = require('path');

var t = babel.types;

function GlobalsFormatter(file) {
  if (file.opts.filename === 'unknown') {
    throw new Error('The babel globals module formatter requires that filename be given');
  }

  this._filename = file.opts.filename;
  this._filenameNoExt = this._filename.substr(0, this._filename.length - 3);
  this._globalName = file.opts._globalName || 'es6Globals';
  this._globals = {};
}

/**
 * This runs after all transformers have had their turn at modifying the ast.
 * @param  {[type]} ast [description]
 * @return {[type]}     [description]
 */
GlobalsFormatter.prototype.transform = function (ast) {
  var contents = ast.body;
  ast.body = [t.expressionStatement(t.callExpression(
    t.memberExpression(
      t.functionExpression(null, [], t.blockStatement(contents)),
      t.identifier('call'),
      false
    ),
    [t.identifier('this')]
  ))];
};

/**
 * Handles imports that don't store the results in variables. For example:
 * `import 'foo'`.
 */
GlobalsFormatter.prototype.importDeclaration = function () {
  // Just ignore this import, since the dependency code will already have been run.
};

/**
 * Handles imports that store the results in variables. For example:
 * `import foo from "foo"`, `import * as bar from "foo"` or `import { foo } from "foo"`.
 * @param {!ImportSpecifier} specifier
 * @param {!ImportDeclaration} node
 * @param {!Array} nodes
 */
GlobalsFormatter.prototype.importSpecifier = function (specifier, node, nodes) {
  var id = this.getGlobalIdentifier(
    node.source.value,
    specifier.imported ? specifier.imported.name : null,
    t.isImportNamespaceSpecifier(specifier)
  );
  nodes.push(t.variableDeclaration('var', [
    t.variableDeclarator(specifier.local, id)
  ]));
};

/**
 * Handles exports that use wildcards to get everything from a source. For example:
 * `export * from  'foo'`;
 */
GlobalsFormatter.prototype.exportAllDeclaration = function() {
  // Just ignore this import, since the object to be imported will already be
  // available from other calls.
};

/**
 * Handles exports that don't store the results in variables. For example:
 * `export var foo = 'foo';`.
 * @param {!ExportDeclaration} node
 * @param {!Array} nodes
 */
GlobalsFormatter.prototype.exportDeclaration = function (node, nodes) {
  var id = this.getGlobalIdentifier(this._filenameNoExt);
  this._assignToGlobal(id, nodes, node.declaration);
};

/**
 * Handles exports that get exported values from local variables. For example:
 * `export {foo}` or `export {foo} from 'foo'`.
 * @param {!ExportSpecifier} specifier
 * @param {!ExportDeclaration} node
 * @param {!Array} nodes
 */
GlobalsFormatter.prototype.exportSpecifier = function (specifier, node, nodes) {
  var idToAssign = specifier.exported;
  if (node.source) {
    idToAssign = this.getGlobalIdentifier(node.source.value, specifier.local.name);
  }

  var id = this.getGlobalIdentifier(this._filenameNoExt, specifier.exported.name);
  this._assignToGlobal(id, nodes, idToAssign);
};

/**
 * Gets the global identifier for the given information.
 * @param {string} filePath The path of the module.
 * @param {string=} name The name of the variable being imported or exported from
 *   the module.
 * @param {boolean} isWildcard If the import or export declaration is using a wildcard.
 * @return {!Specifier}
 */
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

/**
 * Assigns the given expression to a global with the given id.
 * @param {string} id
 * @param {!Array} nodes
 * @param {!Expression} expression
 */
GlobalsFormatter.prototype._assignToGlobal = function(id, nodes, expression) {
  this._createGlobal(id.name, nodes);
  nodes.push(t.expressionStatement(t.assignmentExpression('=', id, expression)));
};

/**
 * Creates the global for the given name, if it hasn't been created yet.
 * @param {string} name
 * @param {!Array} nodes
 */
GlobalsFormatter.prototype._createGlobal = function(name, nodes) {
  var keys = name.split('.');

  var currentGlobal = this._globals;
  var currentGlobalName = 'this.' + keys[1];
  var id;
  for (var i = 2; i < keys.length - 1; i++) {
    currentGlobalName += '.' + keys[i];
    id = t.identifier(currentGlobalName);

    if (!currentGlobal[keys[i]]) {
      currentGlobal[keys[i]] = {};
      nodes.push(t.expressionStatement(
        t.assignmentExpression('=', id, t.objectExpression([]))
      ));
    }
    currentGlobal = currentGlobal[keys[i]];
  }
};

module.exports = GlobalsFormatter;
