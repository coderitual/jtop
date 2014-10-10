({
    baseUrl: '../src',
    name: '../build/almond.js',
    include: ['jtop'],
    insertRequire:  ['jtop'],
    out: '../dist/jtop.js',
    optimize: 'uglify',

    paths: {
        'lib': '../lib',
    },

    preserveLicenseComments: true,

    wrap: {
        startFile: '../wrap/start.frag',
        endFile: '../wrap/end.frag'  
    },

    shim: {
    	'lib/underscore': { exports: "_"}
    }
})
