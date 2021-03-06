const fs = require('fs');
const path = require('path');
const os = require('os');

const minimist = require('minimist');

async function tryReadFile(file) {
  try {
    return await fs.promises.readFile(file, 'utf-8');
  } catch (error) {
    console.error('❌ Invalid input file!');
    process.exit(1);
  }
}

async function createFolder(folder) {
  try {
    await fs.promises.access(folder);
  } catch (error) {
    await fs.promises.mkdir(folder);
  }
}

function getInformationFromTitle(title) {
  const authorStartIndex = title.indexOf('(');
  const authorEndIndex = title.indexOf(')');

  const book = title.slice(0, authorStartIndex - 1);
  const author = title.slice(authorStartIndex + 1, authorEndIndex);

  return { book, author };
}

(async () => {
  const { input, output = 'output', pages = true } = minimist(
    process.argv.slice(2)
  );

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

  Object.entries(highlightsMap).forEach(([title, highlights]) => {
    highlightsMap[title] = highlights.sort((a, b) => a.page - b.page);
  });

  async function createFolderStructure() {
    await createFolder(output);

    for (title of Object.keys(highlightsMap)) {
      const { author } = getInformationFromTitle(title);
      await createFolder(output + path.sep + author);
    }
  }

  await createFolderStructure(Object.keys(highlightsMap));

  const jsonFile = output + path.sep + 'clippings.json';

  await fs.promises.writeFile(jsonFile, JSON.stringify(highlightsMap, null, 2));

  Object.entries(highlightsMap).forEach(async ([title, highlights]) => {
    const { book, author } = getInformationFromTitle(title);
    const file = output + path.sep + author + path.sep + book + '.txt';

    // Remove the previous versions
    try {
      await fs.promises.unlink(file);
    } catch (error) {
      // It's all cool, they just don't exist yet
    }

    const stream = fs.createWriteStream(file, { flags: 'a' });

    stream.write(title + os.EOL + os.EOL);

    highlights.forEach(async (highlight) => {
      if (pages) {
        stream.write('Page ' + highlight.page + os.EOL);
      }

      stream.write(highlight.text + os.EOL + os.EOL);
    });
  });

  console.log('✅ Done!');
})();
