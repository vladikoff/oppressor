# oppressor

streaming http compression response negotiator

# example

You can use plain old streams:

``` js
var oppressor = require('oppressor');
var fs = require('fs');
var http = require('http');

var server = http.createServer(function (req, res) {
    fs.createReadStream(__dirname + '/data.txt')
        .pipe(oppressor(req))
        .pipe(res)
    ;
});
server.listen(8000);
```

or you can use fancy streaming static file server modules like
[filed](http://github.com/mikeal/filed) that set handy things like etag,
last-modified, and content-type headers for you:

``` js
var oppressor = require('oppressor');
var filed = require('filed');
var http = require('http');

var server = http.createServer(function (req, res) {
     filed(__dirname + '/data.txt')
        .pipe(oppressor(req))
        .pipe(res)
    ;
});
server.listen(8000);
```

# methods

``` js
var oppressor = require('oppressor')
```

## var stream = oppressor(req)

Return a [duplex stream](https://github.com/substack/stream-handbook#duplex)
that will be compressed with gzip, deflate, or no compression depending on the
accept-encoding headers sent.

oppressor will emulate calls to http.ServerResponse methods like `writeHead()`
so that modules like [filed](http://github.com/mikeal/filed) that expect to be
piped directly to the response object will work.

# install

With [npm](https://npmjs.org) do:

```
npm install oppressor
```

# license

MIT
