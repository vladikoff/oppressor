var Negotiator = require('negotiator');
var zlib = require('zlib');
var through = require('through');

module.exports = function (req) {
    var negotiator = new Negotiator(req);
    var enc = negotiator.preferredEncodings([ 'gzip', 'compress', 'identity' ]);
    if (Array.isArray(enc)) enc = enc[0];
    var createStream = {
        gzip : zlib.createGzip,
        compress : zlib.createDeflate,
        identity : through,
    }[enc];
    
    if (!createStream) return unacceptable();
    var stream = createStream();
    
    var pipe = stream.pipe;
    stream.pipe = function (target) {
        if (target && target.writeHead && target.setHeader) {
            if (target.statusCode === 200) {
                target.statusCode = stream.statusCode;
            }
            
            if (!target._headers
            || target._headers['content-encoding'] === undefined) {
                target.setHeader('content-encoding', enc);
            }
            
            proxied.forEach(function (p) {
                target[p.name].apply(target, p.arguments);
            });
            
            target.removeHeader('content-length');
            proxyResponse(stream, target, enc !== 'identity');
        }
        return pipe.apply(this, arguments);
    };
    
    stream.statusCode = 200;
    var proxied = proxyResponse(stream, null, enc !== 'identity');
    return stream;
};

function unacceptable () {
    // as per http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
    var stream = through();
    var proxied = proxyResponse(stream);
    stream.pipe = function (target) {
        if (target.statusCode && target.write && target.end) {
            target.statusCode = 406;
            target.write('encoding not accepted');
            target.end();
        }
        else stream.emit('error', 'encoding not accepted');
    };
    return stream;
}

function proxyResponse (stream, dst, doIntercept) {
    // proxy calls through so this module works with request and filed-style
    // streaming pipe http response hijacking
    var proxied = [];
    [ 'writeContinue', 'writeHead', 'setHeader', 'sendDate', 'getHeader',
    'removeHeader', 'addTrailers' ].forEach(function (name) {
        stream[name] = dst
            ? function () {
                if (doIntercept && intercept(name, arguments)) return;
                return dst[name].apply(dst, arguments);
            }
            : function () {
                // hopefully the return value wasn't important >_<
                if (doIntercept && intercept(name, arguments)) return;
                proxied.push({ name : name, arguments : arguments });
            }
        ;
    });
    return proxied;
}

function intercept (name, args) {
    if (name === 'setHeader'
    && String(args[0].toLowerCase()) === 'content-length') {
 
        return true;
    }
    if (name === 'writeHead' && typeof args[1] === 'object') {
        Object.keys(args[1]).forEach(function (key) {
            if (String(key).toLowerCase() === 'content-length') {
                delete args[0][key];
            }
        });
    }
}
