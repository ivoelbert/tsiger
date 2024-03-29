import { ReadStream } from 'fs';
import { Token, tokenFromString, RawToken, yieldableTokens, stringTokenFromString } from './tokens';
import { Position, prettyPrintPosition } from './position';

/* STATE STUFF! */
enum RawState {
    LEXING_TOKENS,
    LEXING_LINE_COMMENT,
    LEXING_BLOCK_COMMENT,
    LEXING_STRING,
}

const prettyPrintState = (state: RawState): string => {
    switch (state) {
        case RawState.LEXING_TOKENS:
            return 'Lexing tokens';
        case RawState.LEXING_LINE_COMMENT:
            return 'Lexing line comment';
        case RawState.LEXING_BLOCK_COMMENT:
            return 'Lexing block comment';
        case RawState.LEXING_STRING:
            return 'Lexing string';
    }
};

const validEndStates: RawState[] = [RawState.LEXING_TOKENS, RawState.LEXING_LINE_COMMENT];

type State = {
    state: RawState;
    data: any;
};

const getInitialState = (state: RawState): State => {
    switch (state) {
        case RawState.LEXING_TOKENS:
            return {
                state,
                data: null,
            };

        case RawState.LEXING_LINE_COMMENT:
            return {
                state,
                data: null,
            };

        case RawState.LEXING_BLOCK_COMMENT:
            return {
                state,
                data: { depth: 1 },
            };

        case RawState.LEXING_STRING:
            return {
                state,
                data: { str: '', pos: null },
            };
    }
};

const shouldEscapeChar = (str: string): boolean => {
    return str.endsWith('\\') && !str.endsWith('\\\\');
};

// The lexer will mantain a global state.
let LEXER_STATE: State = getInitialState(RawState.LEXING_TOKENS);

// Error wrapper to show positions
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
            // This is a new line, bail out of LEXING_LINE_COMMENT
            if (LEXER_STATE.state === RawState.LEXING_LINE_COMMENT) {
                LEXER_STATE = getInitialState(RawState.LEXING_TOKENS);
            }

            // Yield all tokes from that particular line
            yield* lexLine(line, lineNumber);
            lineNumber++;
        }
    }

    // Yield all tokens from the remaining part (consider it a line!)
    yield* lexLine(lastPart, lineNumber);

    if (!validEndStates.includes(LEXER_STATE.state)) {
        throw new LexError(`Lexer finished in an incorrect state! [${prettyPrintState(LEXER_STATE.state)}]`, { line: lineNumber, column: 0 });
    }

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

        if (wordToken && yieldableTokens.includes(wordToken.token) && LEXER_STATE.state === RawState.LEXING_TOKENS) {
            // The whole word is a valid token and we're looking for it, yield it.
            yield wordToken;
        } else {
            // The word isn't a valid token (or we're not looking for any token!), handle that word char by char.
            yield* lexChars(word, lineNumber, colNumber);
        }
        if (LEXER_STATE.state === RawState.LEXING_STRING) {
            LEXER_STATE.data.str += ' ';
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

        const pos: Position = {
            line: lineNumber,
            column: currentCol,
        };

        switch (LEXER_STATE.state) {
            case RawState.LEXING_TOKENS:
                currentWord += char;

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

                    if (previousToken.token === RawToken.LineComen) {
                        // We found a // don't yield! Just transition to the line comment state
                        LEXER_STATE = getInitialState(RawState.LEXING_LINE_COMMENT);
                    } else if (previousToken.token === RawToken.OpenComen) {
                        // We found a /* don't yield! Transition to block comment state (depth 1)
                        LEXER_STATE = getInitialState(RawState.LEXING_BLOCK_COMMENT);
                        currentWord = char;
                    } else if (previousToken.token === RawToken.Quote) {
                        // We found a " don't yield! Transition to string state
                        LEXER_STATE = getInitialState(RawState.LEXING_STRING);
                        LEXER_STATE.data.str = char;
                        LEXER_STATE.data.pos = pos;
                    } else {
                        // We should yield this little guy and start building again from this current character.
                        currentWord = char;
                        yield previousToken;
                        previousToken = tokenFromString(currentWord, pos);
                    }
                }

            case RawState.LEXING_LINE_COMMENT:
                break;

            case RawState.LEXING_BLOCK_COMMENT:
                if (currentWord === '*' && char === '/') {
                    // We found a */ figure out if we need to go back to lexing tokens
                    if (LEXER_STATE.data.depth === 1) {
                        LEXER_STATE = getInitialState(RawState.LEXING_TOKENS);
                        previousToken = tokenFromString('*/', pos);
                    } else {
                        LEXER_STATE.data.depth--;
                    }
                    currentWord = '';
                } else if (currentWord === '/' && char === '*') {
                    // We found a /*, increase comment depth
                    LEXER_STATE.data.depth++;
                    currentWord = '';
                } else {
                    currentWord = char;
                }
                break;

            case RawState.LEXING_STRING:
                if (char === '"' && !shouldEscapeChar(LEXER_STATE.data.str)) {
                    const token: Token = stringTokenFromString(LEXER_STATE.data.str, LEXER_STATE.data.pos);
                    yield token;
                    LEXER_STATE = getInitialState(RawState.LEXING_TOKENS);
                    currentWord = '';
                    previousToken = tokenFromString('"', pos);
                } else {
                    LEXER_STATE.data.str += char;
                }
                break;
        }
    }

    // Handle last token:
    switch (LEXER_STATE.state) {
        case RawState.LEXING_TOKENS:
            // Take care of transitions
            if (previousToken.token === RawToken.LineComen) {
                // We found a // don't yield! Just transition to the line comment state
                LEXER_STATE = getInitialState(RawState.LEXING_LINE_COMMENT);
                return;
            }

            if (previousToken.token === RawToken.OpenComen) {
                // We found a /* don't yield! Transition to block comment state (depth 1)
                LEXER_STATE = getInitialState(RawState.LEXING_BLOCK_COMMENT);
                return;
            }

            if (previousToken.token === RawToken.Quote && currentWord !== '') {
                // We found a " don't yield! Transition to string state
                const pos: Position = {
                    line: lineNumber,
                    column: currentCol,
                };

                LEXER_STATE = getInitialState(RawState.LEXING_STRING);
                LEXER_STATE.data.str = '';
                LEXER_STATE.data.pos = pos;
                return;
            }

            if (!yieldableTokens.includes(previousToken.token) && currentWord.length === 0) {
                // Last token wasn't yieldable, but that's ok. Nothing to yield!
                return;
            }

            // This token should be yieldable
            if (previousToken && yieldableTokens.includes(previousToken.token)) {
                yield previousToken;
                return;
            } else {
                const pos: Position = {
                    line: lineNumber,
                    column: currentCol,
                };

                // If we've got no token something went wrong!
                throw new LexError(`Nothing to yield at the end of word`, pos);
            }

        case RawState.LEXING_LINE_COMMENT:
            return;

        case RawState.LEXING_BLOCK_COMMENT:
            return;

        case RawState.LEXING_STRING:
            return;
    }
}
