import { ReadStream } from 'fs';
import { Token, tokenFromString } from './tokens';
import { Position, prettyPrintPosition } from './position';

class LexError extends Error {
    constructor(msg: string, position: Position) {
        super();

        this.message = `LEX ERROR at ${prettyPrintPosition(position)}: ${msg}`;
    }
}

export async function* lexer(readStream: ReadStream): AsyncGenerator<Token, void, void> {
    let lastPart: string = '';

    let lineNumber: number = 0;
    for await (const chunk of readStream) {
        const lines: string[] = chunk.split('\n');

        lines[0] = lastPart + lines[0];
        lastPart = lines.pop();

        for (const line of lines) {
            // Yield all tokes from that particular line
            yield* lexLine(line, lineNumber);
            lineNumber++;
        }
    }

    // Yield all tokens from the remaining part (consider it a line!)
    yield* lexLine(lastPart, lineNumber);

    return;
}

function* lexLine(line: string, lineNumber: number): Generator<Token, void, void> {
    // Don't try to lex an empty line
    if (line.length === 0) {
        return;
    }

    // Yeah, starts in -1 cause we'll suppose the line starts with a space for simplicity later.
    let colNumber: number = -1;

    const words: string[] = line.split(/\s/);
    for (const word of words) {
        // a new word started with a space! Add that to the length.
        colNumber++;

        // Don't try to lex empty lines
        if (word.length === 0) {
            continue;
        }

        const pos: Position = {
            line: lineNumber,
            column: colNumber,
        };
        const wordToken: Token = tokenFromString(word, pos);

        if (wordToken) {
            // The whole word is a valid token, yield it.
            yield wordToken;
        } else {
            // The word isn't a valid token, yield all tokens from that word
            yield* lexChars(word, lineNumber, colNumber);
        }

        // Update the colNumber
        colNumber += word.length;
    }
}

function* lexChars(word: string, lineNumber: number, colNumber: number): Generator<Token, void, void> {
    let currentWord: string = '';
    let previousToken: Token = null;

    let currentCol: number = colNumber;
    for (const char of word) {
        currentCol++;

        currentWord += char;
        const pos: Position = {
            line: lineNumber,
            column: currentCol,
        }
        const wordToken: Token = tokenFromString(currentWord, pos);

        if (wordToken) {
            // We're still building a token, continue...
            previousToken = wordToken;
        } else {
            // We broke a token, yield whatever we built before.
            if (!previousToken) {
                // If there's nothing to yield, something went wrong.
                throw new LexError(`Cannot build token from '${currentWord}'!`, pos);
            }

            // Yield the little guy and start building again from this character.
            currentWord = char;
            yield previousToken;
            previousToken = tokenFromString(currentWord, pos);
        }
    }

    // That was the last character! Yield whatever token we built so far
    if (previousToken) {
        yield previousToken;
    } else {
        const pos: Position = {
            line: lineNumber,
            column: currentCol,
        }

        // If we've got no token something went wrong!
        throw new LexError(`Nothing to yield at the end of word`, pos);
    }
}
