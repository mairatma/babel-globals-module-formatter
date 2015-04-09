'use strict';

var assert = require('assert');
var babel = require('babel');
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

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n  var foo = this.myGlobal.foo;\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);

		test.done();
	},

	testWildcardImport: function(test) {
		var code = 'import * as foo from "./foo"';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n  var foo = this.myGlobalNamed.foo;\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);

		test.done();
	},

	testNamedImport: function(test) {
		var code = 'import {foo, bar} from "./foo"';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n' +
			'  var foo = this.myGlobalNamed.foo.foo;\n' +
			'  var bar = this.myGlobalNamed.foo.bar;\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);

		test.done();
	},

	testDefaultExport: function(test) {
		var code = 'export default foo';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n' +
			'  this.myGlobal = {};\n' +
			'  this.myGlobal.bar = foo;\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);

		test.done();
	},

	testDefaultAssignmentExport: function(test) {
		var code = 'export default "foo"';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n' +
			'  this.myGlobal = {};\n' +
			'  this.myGlobal.bar = "foo";\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);

		test.done();
	},

	testNamedExport: function(test) {
		var code = 'export {foo, bar}';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n' +
			'  this.myGlobalNamed = {};\n' +
			'  this.myGlobalNamed.bar = {};\n' +
			'  this.myGlobalNamed.bar.foo = foo;\n' +
			'  this.myGlobalNamed.bar.bar = bar;\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);

		test.done();
	},

	testNamedAssignmentExport: function(test) {
		var code = 'export var foo = "foo"';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n' +
			'  var foo = "foo";\n' +
			'  this.myGlobalNamed = {};\n' +
			'  this.myGlobalNamed.bar = {};\n' +
			'  this.myGlobalNamed.bar.foo = foo;\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);

		test.done();
	},

	testNamedSourceExport: function(test) {
		var code = 'export {foo, bar} from "./foo"';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n\n' +
			'  this.myGlobalNamed = {};\n' +
			'  this.myGlobalNamed.bar = {};\n' +
			'  this.myGlobalNamed.bar.foo = this.myGlobalNamed.foo.foo;\n' +
			'  this.myGlobalNamed.bar.bar = this.myGlobalNamed.foo.bar;\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);
		test.done();
	},

	testWildcardSourceExport: function(test) {
		var code = 'export * from "foo"';
		var babelOptions = getBabelOptions(path.resolve('foo/bar.js'));
		var result = babel.transform(code, babelOptions);

		var expectedResult = 'function () {\n' +
			'  "use strict";\n' +
			'}(this)';
		assert.strictEqual(expectedResult, result.code);
		test.done();
	}
};

function getBabelOptions(filename) {
	return {
		_globalName: 'myGlobal',
		filename: filename,
		modules: GlobalsFormatter
	};
}
