import {getTemplate} from '../template.mjs';
const assert = console.assert;

// Test 1: Empty Template
function test1(strings) {
    const template = getTemplate(strings);
    assert(template instanceof HTMLTemplateElement, "should return a template element");
    assert(template.innerHTML == ``, 'template should be empty');
    assert(template.id[0] == 'a', "first character of the id should be an 'a'");
}
test1``;

// Test various templates:
function basicTester(result) {
    return function(strings, ...args) {
        const template = getTemplate(strings);
        assert(template.innerHTML == result, 'createTemplate had unexpected innerHTML', template.innerHTML, result);
    }
}

// Test Node Parts
const test2 = basicTester('<section><header><!--{"type":"node","order":0}--></header><p>Hello World!</p><footer><!--{"type":"node","order":1}--></footer></section>');
test2`<section><header>${'part 1'}</header><p>Hello World!</p><footer>${'part 2'}</footer></section>`;

// Test Attribute Part (no shared since there's no attribute value parts)
const test3 = basicTester('<!--{"parts":[{"type":"attribute","order":0}]}--><div></div>');
test3`<div ${''}></div>`;


// Test Attribute-Value Part (has shared since there's an attribute part)
const test4 = basicTester('<!--{"shared":[["before","","after"]],"parts":[{"type":"attribute-value","order":0,"attrName":"id","index":1,"sharedIndex":0}]}--><div id="beforeafter"></div>');
test4`<div id="before${''}after"></div>`;