(function() {
    'use strict';

    var
        // main api function
        ui$ = function(query) {
            return pipe(query);
        },

        // configuration object
        oConfig,

        // plugin objects that are used in pipelines
        // keys: { name, fnFirstPass, fnLastPass }
        aPlugins = [],

        // plugins that will be invoked by the "standout" plugin
        // TODO: add this to config
        aStandoutPlugins = ['popup', 'highlight'],

        // last search results
        // populated whenever a search occurs
        aLastResults = [],

        // for blocking
        oInProgressFlags = {},

        // used for init and reset
        oConfigDefaults = {
            // amount of time for search highlighting
            standoutDelay: 3000,

            // css styling for search label nodes
            labelStyle: {
                border: '1px solid #c2d6d6',
                backgroundColor: '#FFF',
                color: '#000',
                fontSize: '10px',
                position: 'absolute'
            },

            // css styling for control search hits
            controlStyle: {
                border: '2px solid #00FF00'
            }
        };


    // =====
    // public api
    // =====

    // 'search' api
    function search(query) {
        var aMatches = aLastResults =_search(query)
            .filter(function(o) {
                return o.sIdMatch !== null || o.sNameMatch !== null;
            });
        console.log(aLastResults.length + ' search results');
        _populateSearchTargetVariables(ui$, aMatches);
        return _toControl(aMatches);
    }

    // 'all' api
    function all() {
        var aMatches = aLastResults =_search();
        _populateSearchTargetVariables(ui$, aMatches);
        return _toControl(aMatches);
    }

    // 'config' api
    function config(o) {
        return _appendConfig(o);
    }

    // 'reset' api
    // reset configuration object to defaults
    function reset() {
        oConfig = {};
        oConfig = jQuery.extend({}, {}, oConfigDefaults);
        aLastResults = [];
    }

    // 'toPipeline' api
    function toPipeline(aResults) {
        aLastResults = aResults.map(function(oMatch) {
            return {
                $element: jQuery(oMatch),
                sIdMatch: undefined,
                sNameMatch: undefined
            };
        });
        return _toPipeline();
    }

    // 'pipe' api
    function pipe(query) {
        search(query, oConfig);
        return _toPipeline(); // cache is accessed
    }

    // 'plugin' api
    // fnFirstPass and unLastPass are passed the dom element match
    // A scope context is shared between fnUnSet and fnUnSet.
    function definePlugin(sName, fnFirstPass, fnLastPass) {
        var oPlugin = {
            name: sName,
            fnFirstPass: fnFirstPass,
            fnLastPass: fnLastPass
        };
        oInProgressFlags[sName] = false;
        aPlugins.push(oPlugin);
        ui$[sName] = function(v) {
            if (jQuery.isArray(v)) {
                _invokePlugin(oPlugin, aLastResults);
                return v;
            }
            // if a new query
            return pipe(v)[sName]().toArray();
        };
    }


    // =====
    // private functions api
    // =====

    // http://stackoverflow.com/q/3446170/2295034
    function _escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    }

    // convert search matches to an array of control instances
    function _toControl(aMatches) {
        return aMatches
            .map(function(o) {
                return o.$element.control()[0];
            });
    }

    // append object to config
    function _appendConfig(o) {
        var sKey;
        if (typeof o === 'object') {
            for (sKey in o) {
                if (o.hasOwnProperty(sKey)) {
                    oConfig[sKey] = o[sKey];
                }
            }
        }
        return oConfig;
    }

    // gather all control instances
    function _gatherElements() {
        return jQuery('*[id]')
            .toArray()
            // use jQuery instances
            .map(function(oElement) {
                return jQuery(oElement);
            })
            .filter(function($element) {
                // is at least part of a control
                return $element.control().length > 0 &&
                    // is the root of a control
                    $element.attr('id') === $element.control()[0].getId();
            });
    }

    // overlay style object onto element
    function _assignStyle($node, oStyle) {
        for (var key in oStyle) {
            if (oStyle.hasOwnProperty(key)) {
                $node.css(key, oStyle[key]);
            }
        }
    }

    // used by "search" and "all" api
    function _search(query) {
        var regexp;

        // empty args matches everythin
        if (query === undefined) {
            query = /.*/;
        }

        // sanitize string for regexp if necessary
        try {
            if (query instanceof RegExp) {
                regexp = query;
            } else {
                regexp = new RegExp(query, 'i');
            }
        } catch(e) {
            regexp = new RegExp(_escapeRegExp(query), 'i');
        }

        return _gatherElements()
            // perform regex search
            // put in "match" object form
            .map(function($element) {
                return {
                    $element: $element,
                    idMatch: $element.attr('id').match(regexp),
                    controlNameMatch: $element.control()[0].getMetadata().getName().match(regexp)
                };
            })
            // normalize
            .map(function(o) {
                return {
                    $element: o.$element,
                    sIdMatch: (o.idMatch !== null) ? o.idMatch[0] : null,
                    sNameMatch: (o.controlNameMatch !== null) ? o.controlNameMatch[0] : null
                };
            });
    }

    // reset search target variables
    function _clearSearchTargetVariables(o) {
        o.target = undefined;
        delete o.target;
        [0,1,2,3,4,5,6,7,8,9].forEach(function(i) {
            o['target' + i] = undefined;
            delete o['target' + i];
        });
    }

    // o -> the object to attach the variables to
    // aMatches -> o[]
    //   { $element
    //     sIdMatch
    //     sNameMatch }
    function _populateSearchTargetVariables(o, aMatches) {
        _clearSearchTargetVariables(o);
        if (aMatches.length > 0) {
            o.target = aMatches[0].$element.control()[0];
            aMatches.slice(0,10).forEach(function(oMatch, i) {
                o['target' + i] = oMatch.$element.control()[0];
            });
        }
    }

    // return pipeline object from aLastResults
    function _toPipeline() {
        var oReturn = {
            toArray: function() {
                return aLastResults.map(function(o) {
                    return o.$element.get(0);
                });
            },
            pipe: pipe
        };

        // add plugin functions to pipeline object
        aPlugins.forEach(function(oPlugin) {
            oReturn[oPlugin.name] = function() {
                _invokePlugin(oPlugin, aLastResults);
                return _toPipeline();
            };
        });

        _populateSearchTargetVariables(oReturn, aLastResults);

        // borrow properties/functions from Array.prototype
        // TODO: should I just copy directly from aLastResults?
        Object.getOwnPropertyNames(Array.prototype).slice(0).filter(function(o) {
            return jQuery.isFunction(Array.prototype[o]);
        }).forEach(function(sFunctionName) {
            oReturn[sFunctionName] = jQuery.proxy(Array.prototype[sFunctionName], _toControl(aLastResults));
        });
        oReturn.length = oReturn.toArray().length;

        return oReturn;
    }

    // invoke plugin functionallity to results list
    // call both first and last pass functions
    function _invokePlugin(oPlugin, aList) {
        if (oInProgressFlags[oPlugin.name] === false) {
            oInProgressFlags[oPlugin.name] = true;

            Promise.all(
                aList.map(function(oMatch) {
                    var oContext = {
                        idMatch: oMatch.sIdMatch,
                        nameMatch: oMatch.sNameMatch
                    };
                    oMatch = oMatch.$element;
                    oPlugin.fnFirstPass.call(oContext, oMatch);
                    return new Promise(function(resolve) {
                        setTimeout(function() {
                            oPlugin.fnLastPass.call(oContext, oMatch);
                            resolve();
                        }, oConfig.standoutDelay);
                    });
                })
            ).then(function() {
                oInProgressFlags[oPlugin.name] = false;
            });
        }
        return aList;
    }


    // =====
    // execution starts here
    // =====

    // define popup plugin
    definePlugin('popup',
        function(oMatch) {
            var
                // for positioning the labels
                offset = oMatch.offset(),
                // custom html tag to avoid any pre-existing styling
                $label = jQuery('<ui5query></ui5query>')
                    .addClass('ui5query_label')
                    .css('left', offset.left)
                    .css('top', offset.top);

            // gather lines of text and render delimited by line breaks
            _assignStyle($label, oConfig.labelStyle);
            $label.html(
                [
                    // element id
                    oMatch.attr('id')
                        .replace(
                            new RegExp('(' + this.idMatch + ')'),
                            '<strong>$1</strong>'
                        ),

                    // element ui5 type
                    oMatch.control()[0].getMetadata().getName()
                        .replace(
                            new RegExp('(' + this.nameMatch + ')'),
                            '<strong>$1</strong>'
                        )
                ].reduce(function(a, b) {
                    return a + '<br />' + b;
                })
            ).appendTo(document.body);
            this.$label = $label;
        },
        function(oMatch) {
            this.$label.remove();
        }
    );

    // define highlight plugin
    definePlugin('highlight',
        function(oMatch) {
            this.sOrigBorder = oMatch.css('border');
            _assignStyle(oMatch, oConfig.controlStyle);
            oMatch.addClass('ui5query_match');
        },
        function(oMatch) {
            oMatch.css('border', this.sOrigBorder);
            oMatch.removeClass('ui5query_match');
        }
    );

    // define standout plugin
    definePlugin('standout',
        function(oMatch) {
            var self = this;
            aStandoutPlugins.forEach(function(sPluginName) {
                aPlugins.filter(function(oPlugin) {
                    return oPlugin.name === sPluginName;
                })[0].fnFirstPass.call(self, oMatch);
            });
        },
        function(oMatch) {
            var self = this;
            aStandoutPlugins.forEach(function(sPluginName) {
                aPlugins.filter(function(oPlugin) {
                    return oPlugin.name === sPluginName;
                })[0].fnLastPass.call(self, oMatch);
            });
        }
    );

    // init config
    reset();

    // bring together main api object
    ui$.pipe = pipe;
    ui$.search = search;
    ui$.all = all;
    ui$.config = config;
    ui$.reset = reset;
    ui$.plugin = definePlugin;
    ui$.toPipeline = toPipeline;
    window.ui$ = ui$;
    window.ui5Query = ui$;
}());

