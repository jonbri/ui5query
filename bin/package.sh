#!/bin/sh

version=`grep version ./package.json | \
    awk -F "\"" '{ print $4 }'`

echo "/* https://github.com/jonbri/ui5query v$version" `date` "*/" > ui5query.min.js
uglifyjs index.js --compress --mangle >> ui5query.min.js
