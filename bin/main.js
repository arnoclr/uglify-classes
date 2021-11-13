#! /usr/bin/env node

const optionDefinitions = [
    { name: 'src', type: String, defaultOption: true, defaultValue: '/dist' },
    { name: 'output', type: String, defaultValue: '/dist' },
    { name: 'method', type: String, defaultValue: 'index' }, // hash:Int | random:Int
    { name: 'prefix', type: String, defaultValue: '' }, // classes to replace
    { name: 'suffix', type: String, defaultValue: '' },
    { name: 'append', type: String, defaultValue: '' }, // classes to append
    { name: 'prepend', type: String, defaultValue: '_' }, // classes to prepend
];

const commandLineArgs = require('command-line-args')
const options = commandLineArgs(optionDefinitions)

console.log(options);

const fs = require('fs');
const crypto = require('crypto');
const StringIdGenerator = require('../lib/stringIdGenerator');

var classesMap = {};
const ids = new StringIdGenerator();

function randomString(length) {
    var characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
    var result = ""
    var chaactersLength = characters.length;

    for ( var i = 0; i < 5 ; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * chaactersLength));
    }

    return result;
}

function extractClasses(style) {
    identifiers = style.replace(/\{[\s\S]*?\}/g, '');
    var classes = identifiers.match(new RegExp(`\.${options.prefix}[a-zA-Z0-9_-]+${options.suffix}`, 'g'));
    classes.forEach(cls => {
        // remove leading dot
        cls = cls.substr(1);
        if (!classesMap[cls]) {
            let id;
            if (options.method == 'index') {
                id = ids.next();
            } else if (options.method.includes('random')) {
                const length = options.method.split(':')[1];
                id = randomString(length);
                while (classesMap[id]) {
                    id = randomString(length);
                }
            } else if (options.method.includes('hash')) {
                const length = options.method.split(':')[1];
                id = crypto.createHash('sha256').update(cls).digest('hex').substr(0, length);
            }
            classesMap = {...classesMap, [cls]: options.prepend + id};
        };
    });
}

// read all css files in dist folder or style tag in html files
fs.readdir('./dist/', (err, files) => {
    files.forEach(file => {
        if (file.indexOf('.css') > -1) {
            var style = fs.readFileSync('./dist/' + file, 'utf8');
            extractClasses(style);
        } else if (file.indexOf('.html') > -1) {
            var content = fs.readFileSync('./dist/' + file, 'utf8');
            var style = content.match(/<style>[\s\S]*?<\/style>/g);
            if (style) {
                style = style[0];
                extractClasses(style);
            }
        }
    });
    console.log(`${Object.keys(classesMap).length} classes have been replaced.`);
});

// replace all classes in all assets
const extensions = ['css', 'html', 'js', 'json'];

function replaceCSS(content) {
    // replace classes when have a bracket after
    return content.replace(/\..+\{/g, (identifiers) => {
        return replaceDefault(identifiers);
    })
}

function replaceHTML(content) {
    // replace classes only in class attribute when have a leading space or quote or in style tag (reuse css function)
    // replace style tag
    content = content.replace(/<style>[\s\S]*?<\/style>/g, (style) => {
        return '<style>' + replaceCSS(style) + '</style>';
    })
    // replace class attributes
    content = content.replace(/class="[ a-zA-Z0-9_-]+"/g, (classes) => {
        return replaceDefault(classes);
    })
    return content;
}

function replaceDefault(content) {
    return content.replace(/[a-zA-Z0-9_-]+/g, (cls) => {
        if (classesMap[cls]) {
            return classesMap[cls];
        } else {
            return cls;
        }
    })
}

fs.readdir('./dist/', (err, files) => {
    files.forEach(file => {
        if (extensions.indexOf(file.split('.').pop()) > -1) {
            var content = fs.readFileSync('./dist/' + file, 'utf8');
            const ext = file.split('.').pop();

            if (ext === 'css') {
                content = replaceCSS(content);
            } else if (ext === 'html') {
                content = replaceHTML(content);
            } else if (extensions.indexOf(ext) > -1) {
                content = replaceDefault(content);
            }

            fs.writeFileSync('./dist2/' + file, content);
        }
    });
});
