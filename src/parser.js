const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const minimist = require('minimist');

async function tryReadFile(file) {
  try {
    return await fs.readFile(file, 'utf-8');
  } catch (error) {
    console.error('❌ Invalid input file!');
    process.exit(1);
  }
}

(async () => {
  const { input } = minimist(process.argv.slice(2));

  const content = await tryReadFile(input);
  const clippings = content.split('==========');

  const highlightsMap = {};

  clippings.forEach((clipping) => {
    const [rawTitle, location, text] = clipping
      .split('\r\n')
      .filter((line) => line !== '');

    // Some clippings end up as empty, so we filter them out
    if (!rawTitle || !text) {
      return;
    }

    // Some titles end up with non-ASCII characters in the title, so we filter them out
    const title = rawTitle.replace(/[^\x00-\x7F]/g, '');

    if (!highlightsMap[title]) {
      highlightsMap[title] = [];
    }

    // Extract the page number from the text as an integer
    const [pageInfo] = location.split('|');
    const page = parseInt(pageInfo.substring(24));

    // We filter out the higlights that are included in the higlight, as they are probably incomplete and made by mistake
    const pageHighlights = highlightsMap[title].filter(
      (highlight) => !text.includes(highlight.text)
    );

    highlightsMap[title] = [...pageHighlights, { page, text }];
  });

  try {
    await fs.access('output');
  } catch (error) {
    await fs.mkdir('output');
  }

  await fs.writeFile(
    'output' + path.sep + 'clippings.json',
    JSON.stringify(highlightsMap, null, 2)
  );

  Object.entries(highlightsMap).forEach(async ([title, highlights]) => {
    const file = 'output' + path.sep + title + '.txt';

    await fs.writeFile(file, title);
    await fs.appendFile(file, os.EOL + os.EOL);

    highlights.forEach(async (highlight) => {
      await fs.appendFile(
        file,
        'Page ' + highlight.page + os.EOL + highlight.text + os.EOL + os.EOL
      );
    });
  });

  console.log('✅ Done!');
})();
