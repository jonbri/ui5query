# UI5Query

[![Build Status](https://travis-ci.org/jonbri/ui5query.svg?branch=master)](https://travis-ci.org/jonbri/ui5query)

OpenUI5 control instance viewer.

UI5Query is to controls what jQuery is to the DOM.

Useful for getting references to OpenUI5 controls during console debugging.

Play with UI5Query: [https://jonbri.github.io/ui5query](https://jonbri.github.io/ui5query/)

## Motivation
While developing OpenUI5 applications, I often followed this pattern while debugging in the browser:
* [inspect](https://developers.google.com/web/tools/chrome-devtools/inspect-styles/) the dom, approximating where I think the dom root of a control is
* after not getting close enough, dig around in the "Elements" tab for the desired dom ref
* copy/paste the element's id to the console
* get a jQuery selector to the ref by wrapping with: `jQuery('#pastedId')`
* finally, get the control reference with: `.control()[0]`

After doing this many times I decided to streamline the process with a small tool, hence [UI5Query](#usage).

A similar tool is the ["UI5 Inspector"](http://openui5.tumblr.com/post/129707131982/ui5-inspector-a-new-open-source-chrome-extension) Chrome plugin.


## Usage
Load `node_modules/ui5query/dist/ui5query.min.js`. The nature of this tool (on-the-fly debugging) means that it's often most convenient to simply copy-paste the [distribution](https://raw.githubusercontent.com/jonbri/ui5query/master/ui5query.min.js) directly into the console. You can also integrate via [NPM](https://www.npmjs.com/package/ui5query).

The `ui5Query` (or it's alias `ui$`) function is the main API function, similar to `jQuery`, or `$`. Either a string or a regular expression can be passed in which will match against control id's and type names. The return object can be used to construct pipelines of functionality and access the search matches.

Examples:
```js
// show controls with 'button' in their id
ui$('button').standout();

// a more complicated search
var oButton = ui$(/toplevel.*-button0/).toArray()[0];

// searches will populate the "target" variables
ui$('button');
ui$.target // first button match
ui$.target1 // second button match, etc

// all control instances
ui$()

// string together a bunch of commands -> a "pipeline"
ui$('button').highlight().popup();
```

Pipeline functions:
* `toArray` -> return an array of Control instances
* `popup` -> show an identifying label above the match
* `highlight` -> alter the matches styles to make it more visible
* `standout` -> combination of pipeline functions

## Configuration
`config(object)` is used to configure UI5Query.

Properties:
* `standoutDelay` (default: 3000) -> search highlighting time in ms
* `labelStyle` -> css object for search labels
* `controlStyle` -> css object control highlighting

Example:
```js
ui5query.config({
    standoutDelay: 1000, // one second
    controlStyle: { // change the highlight border
        border: '1px solid red'
    }
})
```


## Plugins
Custom pipeline API functions can be defined. A pipeline name and two functions are needed...one function to perform an action upon a match dom ref, and one function to undo the action. Each function is called once per query match. The second function will be called a short time after the first (`standoutDelay`).

The two functions, `fnFirstPass` and `fnLastPass` are invoked with the same context for state sharing. This shared context is pre-populated with:
* `idMatch` -> control id matches from search query
* `controlNameMatch` -> control type name matches from search query

Example:
```js
definePlugin('highlightText',
    // fnFirstPass
    function(oMatch) {
      this.origColor = jQuery(oMatch).css('color');
      jQuery(oMatch).css('color', 'green');
    },
    // fnLastPass
    function(oMatch) {
      jQuery(oMatch).css('color', this.origColor);
    }
);
```


## Build
```shell
npm install
npm test        # run test suite (qunit, phantomjs)
npm run lint    # eslint
npm run serve   # http://localhost:9000/index.html
npm run package # generates ui5query.min.js
```

## License
[BSD-2-Clause](http://spdx.org/licenses/BSD-2-Clause)

