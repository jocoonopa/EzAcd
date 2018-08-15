'use strict';

var autocompletePrompt = require('cli-autocomplete');

var colors = [{ title: 'red', value: '#f00' }, { title: 'yellow', value: '#ff0' }, { title: 'green', value: '#0f0' }, { title: 'blue', value: '#00f' }, { title: 'black', value: '#000' }, { title: 'white', value: '#fff' }];
var suggestColors = function suggestColors(input) {
    return Promise.resolve(colors.filter(function (color) {
        return color.title.slice(0, input.length) === input;
    }));
};

autocompletePrompt('What is your favorite color?', suggestColors).on('data', function (e) {
    return console.log('Interim value', e.value);
}).on('abort', function (v) {
    return console.log('Aborted with', v);
}).on('submit', function (v) {
    return console.log('Submitted with', v);
});