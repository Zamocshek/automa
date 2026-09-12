const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const babel = require('@babel/core');
const { parse, compileScript } = require('@vue/compiler-sfc');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'business/dev/blocks/editComponents/fieldAssistance.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
  filename, babelrc: false, configFile: false,
  presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' }, modules: 'commonjs' }]],
}).code;
const moduleValue = { exports: {} };
new Function('module', 'exports', code)(moduleValue, moduleValue.exports);
const { variableNames, references, jsonIssue } = moduleValue.exports;

test('inserting a variable retains newly typed text before parent props catch up', async () => {
  const filename = path.join(root, 'business/dev/blocks/editComponents/BlockValueField.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const compiled = compileScript(descriptor, { id: 'field' }).content;
  const code = babel.transformSync(compiled, { babelrc: false, configFile: false,
    presets: [[require.resolve('@babel/preset-env'), { modules: 'commonjs' }]] }).code;
  const module = { exports: {} };
  const resolve = (name) => {
    if (name === 'vue') return {
      ref: value => ({ value }), computed: callback => ({ get value() { return callback(); } }),
      watch() {}, inject: (_key, fallback) => fallback, nextTick: async () => {},
    };
    if (name === 'vue-i18n') return { useI18n: () => ({ t: key => key }) };
    if (name === '@/composable/componentId') return { useComponentId: () => 'field' };
    if (name === './fieldAssistance') return moduleValue.exports;
    throw new Error(name);
  };
  vm.runInNewContext('(function(require,module,exports){' + code + '})')(resolve, module, module.exports);
  const changes = [];
  const component = module.exports.default.setup({ modelValue: 'old', templates: true }, {
    expose() {}, emit: (_name, value) => changes.push(value),
  });
  component.input.value = { focus() {}, setSelectionRange() {} };
  component.updateValue('new text');
  component.selected.value = 'answer';
  await component.insertVariable();
  assert.equal(changes.at(-1), 'new text[[answer]]');
});

test('only variable/resource names, never secret values, enter the picker', () => {
  const workflow = { drawflow: { nodes: [
    { data: { resourceName: 'token', resourceValue: 'private-secret' } },
    { data: { assignVariable: true, variableName: 'answer' } },
    { data: { assignVariable: false, variableName: 'not-an-output' } },
    { data: { variableStoreName: 'answer' } },
  ] } };
  assert.deepEqual(variableNames(workflow), ['answer', 'token']);
  assert.deepEqual(variableNames(), []);
});
test('JSON validation accepts scalar values and flags wrong shapes', () => {
  for (const value of ['false', '0', 'null', '"text"', '[]', '{}']) assert.equal(jsonIssue(value), '');
  assert.equal(jsonIssue('{invalid'), 'json');
  assert.equal(jsonIssue('[]', 'object'), 'object');
  assert.equal(jsonIssue('null', 'object'), 'object');
  assert.equal(jsonIssue('{}', 'array'), 'array');
});
test('runtime references remain editable and do not produce false JSON errors', () => {
  assert.equal(jsonIssue('[[payload]]', 'object'), '');
  assert.equal(jsonIssue('{{variables.payload}}', 'array'), '');
  assert.deepEqual(references('[[token]] and [[token]] / {{variables.answer}}'), ['[[token]]', '{{variables.answer}}']);
  assert.equal(jsonIssue('{bad [[payload]]}'), 'json');
});
test('preset highlight matches the entire configuration, not just a shared GET mode', () => {
  const filename = path.join(root, 'business/dev/blocks/editComponents/BasActionGrid.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const compiled = compileScript(descriptor, { id: 'preset' }).content;
  const code = babel.transformSync(compiled, { babelrc: false, configFile: false,
    presets: [[require.resolve('@babel/preset-env'), { modules: 'commonjs' }]] }).code;
  const module = { exports: {} };
  vm.runInNewContext('(function(module,exports){' + code + '})')(module, module.exports);
  const props = { current: { method: 'GET', operation: 'status' }, active: 'GET' };
  const component = module.exports.default.setup(props, { expose() {}, emit() {} });
  assert.equal(component.isActive({ values: { method: 'GET', operation: 'status' } }), true);
  assert.equal(component.isActive({ values: { method: 'GET', operation: 'request' } }), false);
  assert.equal(component.isActive({}), false);
});
