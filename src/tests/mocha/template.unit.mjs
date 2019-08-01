import {getTemplate} from '../../template.mjs';
const assert = chai.assert;

describe('Template', function() {
    describe('getTemplate', function() {
        it('Should throw an error for non array input', function() {
            assert.throws(function() {
                getTemplate({})
            });
        });
        describe('Empty template', function() {
            let template;
            before('Create empty template', function() {
                function test1(strings) {
                    return getTemplate(strings);
                }
                template = test1``;
            });
            it('should return a template element', function() {
                assert.instanceOf(template, HTMLTemplateElement);
            });
            it('The template element should have empty innerHTML', function() {
                assert.equal(template.innerHTML, ``, 'template should be empty');
            });
            it('First character of the template id should be an a', function() {
                assert.equal(template.id[0], 'a');
            });
        });
        describe('Template contents format', function() {
            const tests = [
                {   title: 'Should produce Comments for Node Parts',
                    strings: [
                        '<section><header>', 
                        '</header><p>Hello World!</p><footer>', 
                        '</footer></section>'
                    ],
                    innerHTML: '<section><header><!--{"type":"node","order":0}--></header><p>Hello World!</p><footer><!--{"type":"node","order":1}--></footer></section>'
                },
                {   title: 'Should produce Comments for Attribute Parts',
                    strings: [
                        '<div ',
                        '></div>'
                    ],
                    innerHTML: '<!--{"parts":[{"type":"attribute","order":0}]}--><div></div>'
                },
                {   title: 'Should produce Comments for AttributeValue Parts',
                    strings: [
                        '<div id="before ',
                        ' after"></div>'
                    ],
                    innerHTML: '<!--{"shared":[["before ",""," after"]],"parts":[{"type":"attribute-value","order":0,"attrName":"id","index":1,"sharedIndex":0}]}--><div id="before  after"></div>'
                }
            ];
            for (const {title, strings, innerHTML} of tests) {
                it(title, function() {
                    const template = getTemplate(strings);
                    assert.equal(template.innerHTML, innerHTML);
                });
            }
        });
    });
});