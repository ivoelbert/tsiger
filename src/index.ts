import * as fs from 'fs';
import { lexer } from './lexer';
import { prettyPrintToken } from './tokens';

const run = async () => {
    const readStream: fs.ReadStream = fs.createReadStream('programs/line_comments.tig', 'utf8');

    try {
        for await (const token of lexer(readStream)) {
            console.log(prettyPrintToken(token));
        }
    } catch(err) {
        console.error(err.message);
    }
};

run();
