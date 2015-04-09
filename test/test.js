var assert = require('assert');
var babel = require('babel');
var fs = require('fs');
var GlobalsFormatter = require('../index');
var path = require('path');

module.exports = {
	testNoFilename: function(test) {
		assert.throws(function() {
			babel.transform('var a = 2;', getBabelOptions());
		});
		test.done();
	},

	testGlobalIdentifier: function(test) {
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var formatter = new GlobalsFormatter({opts: babelOptions});

		assert.strictEqual('this.myGlobal.foo', formatter.getGlobalIdentifier('./foo').name);
		assert.strictEqual('this.myGlobal.bar', formatter.getGlobalIdentifier('./bar').name);
		assert.strictEqual('this.myGlobal.foo', formatter.getGlobalIdentifier('./../foo').name);
		assert.strictEqual('this.myGlobalNamed.foo.bar', formatter.getGlobalIdentifier('./../foo', 'bar').name);
		assert.strictEqual('this.myGlobalNamed.foo', formatter.getGlobalIdentifier('./../foo', null, true).name);

		test.done();
	},

	testDefaultImport: function(test) {
		var code = 'import foo from "./foo"';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'use strict;\n\nvar foo = this.myGlobal.foo;';
		assert.notStrictEqual(expectedResult, result);

		test.done();
	}
};

function getBabelOptions(filename, sourceRoot) {
	return {
		_globalName: 'myGlobal',
		filename: filename,
		modules: GlobalsFormatter,
		sourceRoot: sourceRoot
	};
}
