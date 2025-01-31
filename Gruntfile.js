/*
 * grunt-connect-proxy
 * https://github.com/drewzboto/grunt-connect-proxy
 *
 * Copyright (c) 2013 Drewz
 * Licensed under the MIT license.
 */

const isCI = require("is-ci");

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        eslint: {
            default: {
                options: {
                    /* CI pipeline sets stricter environment to disallow any warnings */
                    maxWarnings: isCI ? 0 : -1,
                },
                src: [
                    "Gruntfile.js",
                    "tasks/*.js",
                    "lib/*.js",
                    "<%= nodeunit.tests %>",
                ],
            },
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ["tmp"],
        },

        // Configuration to be run (and then tested).
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: "localhost",
            },
            proxies: [
                {
                    context: "/defaults",
                    host: "www.defaults.com",
                },
                {
                    context: "/full",
                    host: "www.full.com",
                    port: 8080,
                    https: true,
                    xforward: true,
                    rewrite: {
                        "^/full": "/anothercontext",
                    },
                    headers: {
                        "X-Proxied-Header": "added",
                    },
                    ws: true,
                },
                {
                    context: "/context/test",
                    host: "www.anothercontext.com",
                    rewrite: {
                        "^/context": "/anothercontext",
                        test: "testing",
                    },
                },
                {
                    context: "/invalidrewrite",
                    host: "www.invalidrewrite.com",
                    rewrite: {
                        "^/undefined": undefined,
                        "^/notstring": 13,
                        "^/in": "/thisis",
                    },
                },
                {
                    context: "/missinghost",
                },
                {
                    host: "www.missingcontext.com",
                },
                {
                    context: ["/array1", "/array2"],
                    host: "www.defaults.com",
                },
                {
                    context: "/rewrite",
                    host: "www.yetanothercontext.com",
                    rewrite: {
                        "^(/)rewrite": function(match, p1) {
                            return p1;
                        },
                    },
                },
            ],
            server2: {
                proxies: [
                    {
                        context: "/",
                        host: "www.server2.com",
                    },
                ],
            },
            server3: {
                appendProxies: false,
                proxies: [
                    {
                        context: "/server3",
                        host: "www.server3.com",
                        port: 8080,
                    },
                ],
            },
            request: {
                options: {
                    middleware: function() {
                        return [require("./lib/utils").proxyRequest];
                    },
                },
                proxies: [
                    {
                        context: "/request",
                        host: "localhost",
                        port: 8080,
                        headers: {
                            "x-proxied-header": "added",
                        },
                    },
                    {
                        context: "/hideHeaders",
                        host: "localhost",
                        port: 8081,
                        hideHeaders: ["x-hidden-header-1", "X-HiDdEn-HeAdEr-2"],
                    },
                ],
            },
        },

        // Unit tests.
        nodeunit: {
            tests: "test/connect_proxy_test.js",
            server2: "test/server2_proxy_test.js",
            server3: "test/server3_proxy_test.js",
            utils: "test/utils_test.js",
            request: "test/request_test.js",
            hideHeaders: "test/hide_headers_test.js",
        },
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks("tasks");

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-nodeunit");
    grunt.loadNpmTasks("grunt-eslint");

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask("test", [
        "clean",
        "nodeunit:utils",
        "configureProxies",
        "nodeunit:tests",
        "configureProxies:server2",
        "nodeunit:server2",
        "configureProxies:server3",
        "nodeunit:server3",
        "configureProxies:request",
        "connect:request",
        "nodeunit:request",
        "nodeunit:hideHeaders",
    ]);

    // specifically test that option inheritance works for multi-level config
    grunt.registerTask("test-inheritance", [
        "clean",
        "configureProxies:server2",
        "nodeunit:server2",
    ]);

    // By default, lint and run all tests.
    grunt.registerTask("default", ["jshint", "test"]);
};
