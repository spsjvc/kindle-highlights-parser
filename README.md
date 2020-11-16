# Kindle Highlights Parser ✂️

## Why?

The format in which the Kindle saves your highlights is terrible. It's hard to read, the highlights are sorted chronologically, and it's a nightmare if you want to transfer them into a note-taking app.

This tool helps you make sense of your Kindle highlights. It extracts the highlights for each book into a separate file and groups them by author, so they are easier to find. It also properly sorts them by page.

## Requirements

- [Node.js](https://nodejs.org)

## Usage

```
$ node ./src/parser.js \
    --input /Volumes/Kindle/documents/My\ Clippings.txt \
    --output /Users/dragisa/Documents/Kindle\ Clippings \
    --no-pages
```

## Parameters

- `--input` Path to your Kindle's clippings file
- `--output` Path to the folder where the highlights should be saved
  - default: Creates a folder called `output` at the root of the project
- `--no-pages` Omits the page numbers from the highlights

## Examples

![alt text](examples/folder-structure.png 'Folder structure example')
