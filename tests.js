QUnit.config.reorder = false;
(function() {
    'use strict';

    //////////////////////////////////
    // reporting
    // log results to console for PhantomJS
    QUnit.log(function(details) {
        if (details.result === true) {
            return;
        }
        console.log(
            'TEST FAILURE. ' +
            'MODULE: ' + details.module + ', ' +
            'NAME: ' + details.name + ', ' +
            'MESSAGE: ' + details.message
        );
    });

    // log results to console for PhantomJS
    QUnit.done(function(details) {
        console.log(
            'Total: ' + details.total + ', ' +
            'Failed: ' + details.failed + ', ' +
            'Passed: ' + details.passed + ', ' +
            'Time: ' + details.runtime + 'ms'
        );
    });

    var iHowManyButtons = window._ui5query_numOfEachType,
        iHowManyTexts = window._ui5query_numOfEachType,
        iHowManyDatePickers = window._ui5query_numOfEachType,
        iHowManyLabels = window._ui5query_numOfEachType,
        iTotalMatches = iHowManyButtons + iHowManyTexts + iHowManyDatePickers + iHowManyLabels;


    //////////////////////////////////
    // utility functions
    function howManyPopups() {
        return jQuery('.ui5query_label').length;
    }
    function howManyHighlighting() {
        return jQuery('.ui5query_match').length;
    }
    function getPopupTextMatch(i) {
        i = (i !== undefined) ? i : 0;
        return jQuery('.ui5query_label').eq(i)
            .find('strong')
            .toArray()
            .map(function($strong) {
                return $strong.innerHTML;
            })
            .join(',');
    }


    //////////////////////////////////
    // setup
    function beforeEach() {
        ui$.reset();
        ui$.config({
            standoutDelay: iDelay
        });
    }
    function afterEach(assert) {
        var done = assert.async();
        setTimeout(function() {
            ui$.reset();
            done();
        }, iDelay * 2);
    }

    // configure how long each test should take
    // take into consideration the highlighting setTimeout
    var iDelay = starparam.get('delay') || 500;
    iDelay = parseInt(iDelay, 10);


    //////////////////////////////////
    // tests

    QUnit.module('search', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('no match', function(assert) {
        assert.strictEqual(ui$.search('zzz').length, 0, '0 results');
    });
    QUnit.test('string match', function(assert) {
        assert.strictEqual(ui$.search('button').length, iHowManyButtons, 'all buttons returned');
    });
    QUnit.test('regex match', function(assert) {
        assert.strictEqual(ui$.search(/bu.*on/).length, iHowManyButtons, 'all buttons returned');
    });
    QUnit.test('all regex', function(assert) {
        assert.strictEqual(ui$.search(/.*/).length, iTotalMatches, 'all results');
    });
    QUnit.test('no args matches everythin', function(assert) {
        assert.strictEqual(ui$.search().length, iTotalMatches, 'all results');
    });
    QUnit.test('by control type', function(assert) {
        assert.strictEqual(ui$.search('sap.m.Button').length, iHowManyButtons, 'all buttons returned');
    });
    QUnit.test('returns control types', function(assert) {
        var oFirstButton = ui$.search('button1')[0];
        assert.strictEqual(oFirstButton.getMetadata().getName(), 'sap.m.Button', 'button found');
    });


    QUnit.module('"all" api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('smoke', function(assert) {
        assert.strictEqual(ui$.all().length, iTotalMatches, 'all controls found');
    });
    QUnit.test('returns control types', function(assert) {
        assert.strictEqual(typeof ui$.all()[0].getMetadata, 'function', 'control was returned');
    });
    QUnit.test('in sync with search api', function(assert) {
        assert.expect(iTotalMatches);
        var aSearchResults = ui$.search(/.*/),
            aAllResults = ui$.all();
        for (var i = 0; i < iTotalMatches; i++) {
            assert.strictEqual(aSearchResults[i].getId(), aAllResults[i].getId(), 'record ' + i + ' in sync');
        }
    });


    QUnit.module('popup', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('via search api', function(assert) {
        ui$.popup(ui$.search('button'));
        assert.strictEqual(howManyPopups(), iHowManyButtons, 'all buttons given popups');
    });
    QUnit.test('via all api', function(assert) {
        ui$.popup(ui$.all());
        assert.strictEqual(howManyPopups(), iTotalMatches, 'all popups appear');
    });
    QUnit.test('via pipe api with sub-set (string) of matches', function(assert) {
        ui$.pipe('button').popup();
        assert.strictEqual(howManyPopups(), iHowManyButtons, 'all button popups appear');
    });
    QUnit.test('via pipe api with sub-set (regexp) of matches', function(assert) {
        ui$.pipe(/bu\w\won/).popup();
        assert.strictEqual(howManyPopups(), iHowManyButtons, 'all button popups appear');
    });
    QUnit.test('via pipe api with all matches', function(assert) {
        ui$.pipe(/.*/).popup();
        assert.strictEqual(howManyPopups(), iTotalMatches, 'all popups appear');
    });


    QUnit.module('highlighting', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('via search api', function(assert) {
        ui$.highlight(ui$.search('button'));
        assert.strictEqual(howManyHighlighting(), iHowManyButtons, 'all buttons given highlighting');
    });
    QUnit.test('via all api', function(assert) {
        ui$.highlight(ui$.all());
        assert.strictEqual(howManyHighlighting(), iTotalMatches, 'all highlighting appear');
    });
    QUnit.test('via pipe api with sub-set (string) of matches', function(assert) {
        ui$.pipe('button').highlight();
        assert.strictEqual(howManyHighlighting(), iHowManyButtons, 'all button highlighting appear');
    });
    QUnit.test('via pipe api with sub-set (regexp) of matches', function(assert) {
        ui$.pipe(/bu\w\won/).highlight();
        assert.strictEqual(howManyHighlighting(), iHowManyButtons, 'all button highlighting appear');
    });
    QUnit.test('via pipe api with all matches', function(assert) {
        ui$.pipe(/.*/).highlight();
        assert.strictEqual(howManyHighlighting(), iTotalMatches, 'all highlighting appear');
    });



    QUnit.module('inProgress flag', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('inProgress flag', function(assert) {
        ui$.popup(ui$.search('button'));
        ui$.popup(ui$.search('button'));
        assert.strictEqual(howManyPopups(), iHowManyButtons, 'correct number of button popups are shown (not double)');
    });


    QUnit.module('target variables', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('target variables populated', function(assert) {
        ui$.search(/.*/);
        assert.strictEqual(ui$.target.getId(), '__button0', 'target is populated');
        assert.strictEqual(ui$.target0, ui$.target, 'target0 is populated');
        assert.strictEqual(ui$.target1.getId(), '__button1', 'target1 is populated');
        assert.strictEqual(ui$.target9.getId(), '__label0', 'target9 is populated');
    });
    QUnit.test('target variables are reset', function(assert) {
        ui$.search(/.*/);
        ui$.search('zzz'); // there should be no "zzz" match
        assert.strictEqual(ui$.target, undefined, 'target was reset');
        assert.strictEqual(ui$.target0, undefined, 'target0 was reset');
        assert.strictEqual(ui$.target1, undefined, 'target1 was reset');
        assert.strictEqual(ui$.target2, undefined, 'target1 was reset');
        assert.strictEqual(ui$.target9, undefined, 'target1 was reset');
    });
    QUnit.test('targets that should never be set', function(assert) {
        ui$.search(/.*/);
        assert.strictEqual(ui$.target10, undefined, 'target10 should never be set');
        assert.strictEqual(ui$.target11, undefined, 'target11 should never be set');
    });
    QUnit.test('set after all api', function(assert) {
        ui$.all();
        assert.strictEqual(ui$.target0.getId(), '__button0', 'target 0 is populated');
        assert.strictEqual(ui$.target9.getId(), '__label0', 'target 9 is populated');
    });
    QUnit.test('set after all pipe api (all)', function(assert) {
        ui$.pipe(/.*/);
        assert.strictEqual(ui$.target0.getId(), '__button0', 'target 0 is populated');
        assert.strictEqual(ui$.target9.getId(), '__label0', 'target 9 is populated');
    });
    QUnit.test('set after all pipe api (subset)', function(assert) {
        ui$.pipe('button');
        assert.strictEqual(ui$.target0.getId(), '__button0', 'target 0 is populated');
        assert.strictEqual(ui$.target9, undefined, 'target 9 is undefined');
    });
    QUnit.test('set after all highlight api (all)', function(assert) {
        ui$.highlight(/.*/);
        assert.strictEqual(ui$.target0.getId(), '__button0', 'target 0 is populated');
        assert.strictEqual(ui$.target9.getId(), '__label0', 'target 9 is populated');
    });
    QUnit.test('set after all highlight api (subset)', function(assert) {
        ui$.highlight('button');
        assert.strictEqual(ui$.target0.getId(), '__button0', 'target 0 is populated');
        assert.strictEqual(ui$.target9, undefined, 'target 9 is undefined');
    });
    QUnit.test('set after all popup api (all)', function(assert) {
        ui$.popup(/.*/);
        assert.strictEqual(ui$.target0.getId(), '__button0', 'target 0 is populated');
        assert.strictEqual(ui$.target9.getId(), '__label0', 'target 9 is populated');
    });
    QUnit.test('set after all popup api (subset)', function(assert) {
        ui$.popup('button');
        assert.strictEqual(ui$.target0.getId(), '__button0', 'target 0 is populated');
        assert.strictEqual(ui$.target9, undefined, 'target 9 is undefined');
    });


    QUnit.module('config api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('api returns config', function(assert) {
        assert.strictEqual(typeof ui$.config().standoutDelay, 'number', 'config object is returned');
    });
    QUnit.test('api alters config', function(assert) {
        ui$.config({ standoutDelay: 10 });
        assert.strictEqual(ui$.config().standoutDelay, 10, 'config object is correct');
    });
    QUnit.test('reset', function(assert) {
        ui$.config({ standoutDelay: 10 });
        ui$.reset();
        assert.ok(ui$.config().standoutDelay !== 10, 'config object was reset');
    });


    QUnit.module('controlStyle config api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('custom control style', function(assert) {
        ui$.config({
            controlStyle: { fontSize: '5px' }
        });
        ui$.highlight(ui$.all());
        assert.strictEqual(ui$.search('button')[0].$().css('fontSize'), '5px', 'custom styling applied');
    });


    QUnit.module('labelStyle config api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('custom label style', function(assert) {
        ui$.config({
            labelStyle: { display: 'none' }
        });
        ui$.popup(ui$.all());
        assert.strictEqual(jQuery('.ui5query_label:first').css('display'), 'none', 'custom styling applied');
    });


    QUnit.module('pipe api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('pipe toArray', function(assert) {
        assert.strictEqual(ui$.pipe(/.*/).toArray().length, iTotalMatches, 'all returned matches');
    });
    QUnit.test('pipe no args', function(assert) {
        assert.strictEqual(ui$.pipe().toArray().length, iTotalMatches, 'all returned matches');
    });
    QUnit.test('pipe toArray -> correct type', function(assert) {
        assert.strictEqual(ui$.pipe(/.*/).toArray()[0].hasAttribute('data-sap-ui'), true, 'correct type');
    });
    QUnit.test('pipe just match button -> toArray', function(assert) {
        assert.strictEqual(ui$.pipe(/bu\w\won/).toArray().length, iHowManyButtons, 'all buttons returned');
    });
    QUnit.test('pipe highlighted and popup', function(assert) {
        ui$.pipe(/.*/).highlight().popup();
        assert.strictEqual(howManyHighlighting(), iTotalMatches, 'all matches highlighted');
        assert.strictEqual(howManyPopups(), iTotalMatches, 'all popups visible');
    });
    QUnit.test('pipe standout', function(assert) {
        ui$.pipe(/.*/).standout();
        assert.strictEqual(howManyHighlighting(), iTotalMatches, 'all matches highlighted');
        assert.strictEqual(howManyPopups(), iTotalMatches, 'all popups visible');
    });
    QUnit.test('target variables', function(assert) {
        assert.strictEqual(ui$.pipe('button').target0.getId(), '__button0', 'target 0 is populated');
    });
    QUnit.test('borrowed filter', function(assert) {
        var aResults = ui$.pipe('button').filter(function(oResult) {
            return oResult.getId() === '__button0';
        });
        assert.strictEqual(aResults.length, 1, 'filter worked');
    });
    QUnit.test('borrowed map', function(assert) {
        var aResults = ui$.pipe('button').map(function(oResult) {
            return oResult.getId();
        });
        assert.strictEqual(aResults[0], '__button0', 'map worked');
    });
    QUnit.test('length', function(assert) {
        assert.strictEqual(ui$.pipe('button').length, iHowManyButtons, 'correct length');
    });


    QUnit.module('toPipeline api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('toPipeline toArray', function(assert) {
        assert.strictEqual(ui$.toPipeline(ui$.all()).toArray().length, iTotalMatches, 'all matches returned');
    });
    QUnit.test('toPipeline toArray', function(assert) {
        var aResults_button = ui$.search('button');
        var aResults_all = ui$.search(/.*/);
        assert.strictEqual(ui$.toPipeline(aResults_button).toArray().length, iHowManyButtons, 'only buttons returned');
    });


    QUnit.module('popup query api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('smoke', function(assert) {
        ui$.popup(/.*/);
        assert.strictEqual(howManyPopups(), iTotalMatches, 'all popups appear');
    });
    QUnit.test('subset', function(assert) {
        ui$.popup(/button/);
        assert.strictEqual(howManyPopups(), iHowManyButtons, 'all buttons have popups');
    });


    QUnit.module('highlight query api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('smoke', function(assert) {
        ui$.highlight(/.*/);
        assert.strictEqual(howManyHighlighting(), iTotalMatches, 'all matches highlighted');
    });
    QUnit.test('subset', function(assert) {
        ui$.highlight(/button/);
        assert.strictEqual(howManyHighlighting(), iHowManyButtons, 'all buttons highlighted');
    });


    // standout api
    QUnit.module('standout query api', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('smoke', function(assert) {
        ui$.standout(/.*/);
        assert.strictEqual(howManyPopups(), iTotalMatches, 'all popups shown');
        assert.strictEqual(howManyHighlighting(), iTotalMatches, 'all matches highlighted');
    });
    QUnit.test('subset', function(assert) {
        ui$.standout(/button/);
        assert.strictEqual(howManyPopups(), iHowManyButtons, 'all button popups shown');
        assert.strictEqual(howManyHighlighting(), iHowManyButtons, 'all buttons highlighted');
    });


    QUnit.module('jQuery-like design', {
        beforeEach: beforeEach,
        afterEach: afterEach
    });
    QUnit.test('find all', function(assert) {
        assert.strictEqual(ui$(/.*/).toArray().length, iTotalMatches, 'all controls found');
    });
    QUnit.test('other forms', function(assert) {
        assert.strictEqual(ui5Query(/.*/).toArray().length, iTotalMatches, 'all controls found');
    });
    QUnit.test('empty arg', function(assert) {
        assert.strictEqual(ui$().toArray().length, iTotalMatches, 'all controls found');
    });
    QUnit.test('subset', function(assert) {
        assert.strictEqual(ui$(/button/).toArray().length, iHowManyButtons, 'all buttons found');
    });
    QUnit.test('use pipeline', function(assert) {
        ui$(/button/).popup().highlight();
        assert.strictEqual(howManyPopups(), iHowManyButtons, 'all button popups shown');
        assert.strictEqual(howManyHighlighting(), iHowManyButtons, 'all buttons highlighted');
    });

}());
