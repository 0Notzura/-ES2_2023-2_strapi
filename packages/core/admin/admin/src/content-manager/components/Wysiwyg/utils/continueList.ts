import CodeMirror from 'codemirror5';

// Disabling eslint on purpose
/* eslint-disable */

const listRE = /^(\s*)(>[> ]*|[*+-] \[[x ]\]\s|[*+-]\s|(\d+)([.)]))(\s*)/;
const emptyListRE = /^(\s*)(>[> ]*|[*+-] \[[x ]\]|[*+-]|(\d+)[.)])(\s*)$/;
const unorderedListRE = /[*+-]\s/;

function isInputDisabled(cm: CodeMirror.Editor): boolean {
  // @ts-expect-error - cm does not recognize disableInput.
  return cm.getOption('disableInput');
}

function shouldInsertNewlineAndIndent(cm: CodeMirror.Editor, pos: CodeMirror.Position): boolean {
  const eolState = cm.getStateAfter(pos.line);
  const inList = eolState.list !== false;
  const inQuote = eolState.quote !== 0;
  const line = cm.getLine(pos.line);
  const match = listRE.exec(line);
  const cursorBeforeBullet = /^\s*$/.test(line.slice(0, pos.ch));

  return !ranges[i].empty() || (!inList && !inQuote) || !match || cursorBeforeBullet;
}

function shouldEndListOrQuote(line: string, inQuote: boolean): boolean {
  const endOfQuote = inQuote && />\s*$/.test(line);
  const endOfList = !/>\s*$/.test(line);

  return endOfQuote || endOfList;
}

function endOfQuoteOrList(cm: CodeMirror.Editor, inQuote: boolean, line: string, pos: CodeMirror.Position) {
  if (shouldEndListOrQuote(line, inQuote)) {
    cm.replaceRange('', { line: pos.line, ch: 0 }, { line: pos.line, ch: pos.ch + 1 });
  }
}

function createNewlineAndIndentReplacement(cm: CodeMirror.Editor, match: RegExpExecArray): string {
  const indent = match[1];
  const after = match[5];
  const numbered = !(unorderedListRE.test(match[2]) || match[2].indexOf('>') >= 0);
  const bullet = numbered ? parseInt(match[3], 10) + 1 + match[4] : match[2].replace('x', ' ');

  return '\n' + indent + bullet + after;
}

/*
  functions coming from CodeMirror addons continuelist.js
  ===> https://github.com/codemirror/CodeMirror/blob/master/addon/edit/continuelist.js

  we imported it because the way the addon ask to use markdown mode
  since we have our own markdown preview system we couldn't use it directly
  only thing we changed is removing the part that enabled addon only with markdown mode
*/

function newlineAndIndentContinueMarkdownList(cm: CodeMirror.Editor) {
  if (isInputDisabled(cm)) return CodeMirror.Pass;

  const ranges = cm.listSelections();
  const replacements = [];

  for (let i = 0; i < ranges.length; i++) {
    const pos = ranges[i].head;
    const eolState = cm.getStateAfter(pos.line);
    const inList = eolState.list !== false;
    const inQuote = eolState.quote !== 0;
    const line = cm.getLine(pos.line);
    const match = listRE.exec(line);
    const cursorBeforeBullet = /^\s*$/.test(line.slice(0, pos.ch));

    if (shouldInsertNewlineAndIndent(cm, pos) || cursorBeforeBullet) {
      cm.execCommand('newlineAndIndent');
      return;
    }

    if (emptyListRE.test(line)) {
      endOfQuoteOrList(cm, inQuote, line, pos);
      replacements[i] = '\n';
    } else {
      replacements[i] = createNewlineAndIndentReplacement(cm, match);
      if (numbered) incrementRemainingMarkdownListNumbers(cm, pos, match);
    }
  }

  cm.replaceSelections(replacements);
}


function incrementRemainingMarkdownListNumbers(cm: CodeMirror.Editor, pos: CodeMirror.Position) {
  var startLine = pos.line,
    lookAhead = 0,
    skipCount = 0;
  var startItem = listRE.exec(cm.getLine(startLine)),
    startIndent = startItem![1];

  do {
    lookAhead += 1;
    var nextLineNumber = startLine + lookAhead;
    var nextLine = cm.getLine(nextLineNumber);
    var nextItem = listRE.exec(nextLine);

    if (nextItem) {
      var nextIndent = nextItem[1];
      var newNumber = parseInt(startItem![3], 10) + lookAhead - skipCount;
      var nextNumber = parseInt(nextItem[3], 10),
        itemNumber = nextNumber;

      if (startIndent === nextIndent && !isNaN(nextNumber)) {
        if (newNumber === nextNumber) itemNumber = nextNumber + 1;
        if (newNumber > nextNumber) itemNumber = newNumber + 1;
        cm.replaceRange(
          nextLine.replace(listRE, nextIndent + itemNumber + nextItem[4] + nextItem[5]),
          {
            line: nextLineNumber,
            ch: 0,
          },
          {
            line: nextLineNumber,
            ch: nextLine.length,
          }
        );
      } else {
        if (startIndent.length > nextIndent.length) return;
        // This doesn't run if the next line immediately indents, as it is
        // not clear of the users intention (new indented item or same level)
        if (startIndent.length < nextIndent.length && lookAhead === 1) return;
        skipCount += 1;
      }
    }
  } while (nextItem);
}

export { newlineAndIndentContinueMarkdownList };
