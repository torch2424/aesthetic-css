const fs = require('fs');
const Mustache = require('mustache');
var argv = require('minimist')(process.argv.slice(2), {
  boolean: ['dev'],
  alias: {
    d: 'dev'
  }
});

const livereloadHtmlScript = `
<script>
document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
':35729/livereload.js?snipver=1"></' + 'script>')
</script>
`;

const mustacheData = {
  vaporcss: fs.readFileSync('./dist/index.css', 'utf8'),
  livereload: argv.dev ? livereloadHtmlScript : '',
  daniel: fs.readFileSync('./demo/daniel.html', 'utf8')
}

const demoWithCss = Mustache.render(fs.readFileSync('./demo/index.html', 'utf8'), mustacheData);

fs.writeFileSync('./dist/index.html', demoWithCss);
