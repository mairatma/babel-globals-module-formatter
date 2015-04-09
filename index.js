var babel = require('babel')

function GlobalsFormatter() {}

GlobalsFormatter.prototype.transform = function (ast) {
  // this is ran after all transformers have had their turn at modifying the ast
  // feel free to modify this however
};

GlobalsFormatter.prototype.importDeclaration = function (node, nodes) {
  // node is an ImportDeclaration
};

GlobalsFormatter.prototype.importSpecifier = function (specifier, node, nodes) {
  // specifier is an ImportSpecifier
  // node is an ImportDeclaration
};

GlobalsFormatter.prototype.exportDeclaration = function (node, nodes) {
  // node is an ExportDeclaration
};

GlobalsFormatter.prototype.exportSpecifier = function (specifier, node, nodes) {
  // specifier is an ExportSpecifier
  // node is an ExportDeclaration
};

module.exports = GlobalsFormatter;
