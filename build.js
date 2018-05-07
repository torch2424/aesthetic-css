const fs = require('fs');
const recursive = require('recursive-readdir');
const highlightJs = require('highlight.js');
const camelCase = require('camelcase');
const Mustache = require('mustache');
var argv = require('minimist')(process.argv.slice(2), {
  boolean: ['dev'],
  alias: {
    d: 'dev'
  }
});

// Our script to add our livereload
const livereloadHtmlScript = `
<script>
document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
':35729/livereload.js?snipver=1"></' + 'script>')
</script>
`;

// Our mustace data object
const mustacheData = {
  vaporCss: fs.readFileSync('./dist/index.css', 'utf8').toString(),
  highlightJsCss: fs.readFileSync('./demo/highlightJs.css', 'utf8').toString(),
  liveReload: argv.dev ? livereloadHtmlScript : '',
  daniel: fs.readFileSync('./demo/daniel.html', 'utf8').toString(),
}

// Find all HTML Files within the demo directory, that are not our index or daniel
recursive('./demo', ['index.html', 'daniel.html', '*.css']).then((files) => {

  // Create an object for each file that we found, and assign a filepath and name
  files.forEach(filePath => {

    // Read the file path
    const fileText = fs.readFileSync(filePath, 'utf8').toString();

    // Highlight the HTML and append it to the fileText
    const highlightedFileText = highlightJs.fixMarkup(highlightJs.highlight('html', fileText).value);
    const elementAndSnippet = `${fileText}
    <div class="vapor-windows-95-container snippet-container">
      <pre>
        <code class="vapor-font">${highlightedFileText.trim()}</code>
      </pre>
    </div>`;

    // Get our filePath as camel case. Replace / and - with _
    // Using Split and join to replace all
    const replacedPath = filePath.split('demo/').join('').split('/').join('_').split('.html').join('');
    const camelCaseFilePath = camelCase(replacedPath);

    mustacheData[camelCaseFilePath] = elementAndSnippet;
  });

  const demoWithCss = Mustache.render(fs.readFileSync('./demo/index.html', 'utf8'), mustacheData);

  fs.writeFileSync('./dist/index.html', demoWithCss);
});
