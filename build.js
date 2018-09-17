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

const capitalize = (string) => {
  return camelCase([string], {pascalCase: true});
}

// Our script to add our livereload
const livereloadHtmlScript = `
<script>
document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
':35729/livereload.js?snipver=1"></' + 'script>')
</script>
`;

// Get all of the aesthetic css
const vaporCss = fs.readFileSync('./dist/index.css', 'utf8').toString();

// Log out the size of the CSS
console.log(`
  A E S T H E T I C CSS Size: ${Buffer.byteLength(vaporCss, 'utf8') / 1024 }KB
`);

// Our mustace data object
const mustacheData = {
  vaporCss: vaporCss,
  bootAnimation: argv.dev ? 'animation: boot-animation 0s;' : 'animation: boot-animation 7s;',
  highlightJsCss: fs.readFileSync('./demo/highlightJs.css', 'utf8').toString(),
  liveReload: argv.dev ? livereloadHtmlScript : '',
  demoCss: fs.readFileSync('./demo/index.css', 'utf8').toString(),
}

// Start a table of contents as json
const tableOfContents = {};

// Find all HTML Files within the demo directory, that are not our index or daniel
recursive('./demo', ['index.html', 'daniel.html', '*.css']).then((files) => {

  // Create an object for each file that we found, and assign a filepath and name
  files.forEach(filePath => {

    // Read the file path
    const fileText = fs.readFileSync(filePath, 'utf8').toString();

    // Get our filePath as camel case. Replace / and - with _
    // Using Split and join to replace all
    const replacedPath = filePath.split('demo/').join('').split('/').join('_').split('.html').join('');
    const camelCaseFilePath = camelCase(replacedPath);

    // Add the path to our table of contents
    // Re-assigning currentTableDirectoryObject to a key in the 
    // Table of contents, until we get the level deep that we need.
    let currentTableDirectoryObject = tableOfContents;
    const splitPath = replacedPath.split('_');
    splitPath.forEach((pathElement, index) => {
      if (index === splitPath.length - 1) {
        currentTableDirectoryObject[pathElement] = camelCaseFilePath;
        return;
      } else if (!currentTableDirectoryObject[pathElement]) {
        currentTableDirectoryObject[pathElement] = {};
      }

      currentTableDirectoryObject = currentTableDirectoryObject[pathElement];
    });

    // Highlight the HTML and append it to the fileText
    const highlightedFileText = highlightJs.fixMarkup(highlightJs.highlight('html', fileText).value);
    
    const hashId = `${camelCaseFilePath}`;

    const snippet = `<div id="${hashId}"></div>
    ${fileText}
    <div class="vapor-windows-95-container margin-top">
      <div class="snippet-container">
        <pre>
          <code class="vapor-font">${highlightedFileText.trim()}</code>
        </pre>
      </div>
    </div>`;

    mustacheData[camelCaseFilePath] = snippet;
  });

  const getContentsLink = (contents) => {
    let contentsList = `<ul>
      `;
    Object.keys(contents).forEach(contentsKey => {
      if (typeof contents[contentsKey] === 'string') {
        contentsList += `
          <li>
            <a href="#${contents[contentsKey]}">${capitalize(contentsKey)}</a>
          </li>
        `
      } else {
        contentsList += `<h1>${capitalize(contentsKey)}</h1>`
        contentsList += getContentsLink(contents[contentsKey])
      }
    });
    contentsList += '</ul>';
    return contentsList
  }

  // Let's build our table of contents
  const tableOfContentsSnippet = `
  <h2>Elements</h2>
  ${getContentsLink(tableOfContents['elements'])}
  <h2>Effects</h2>
  ${getContentsLink(tableOfContents['effects'])}
  <h2>Colors</h2>
  ${getContentsLink(tableOfContents['colors'])}
  <h2>Fonts</h2>
  ${getContentsLink(tableOfContents['fonts'])}
  `;
  mustacheData['tableOfContents'] = tableOfContentsSnippet;

  const demoWithCss = Mustache.render(fs.readFileSync('./demo/index.html', 'utf8'), mustacheData);

  fs.writeFileSync('./dist/index.html', demoWithCss);
});


