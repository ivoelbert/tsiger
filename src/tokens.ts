import { Position, prettyPrintPosition } from './position';

export type Token = {
    token: RawToken;
    data: any;
    position: Position;
};

export enum RawToken {
    Point, // .
    Colon, // :
    Assign, // :=
    Comma, // ,
    Semicolon, // ;
    OpenParen, // (
    CloseParen, // )
    OpenBracket, // [
    CloseBracket, // ]
    OpenBraces, // {
    CloseBraces, // }
    Ampersand, // &
    Pipe, // |
    Equals, // =
    Lt, // <
    Lte, // <=
    Gt, // >
    Gte, // >=
    Neq, // <>
    Plus, // +
    Minus, // -
    Times, // *
    Div, // /
    Type, // type
    Array, // array
    Of, // of
    Var, // var
    Function, // function
    Let, // let
    In, // in
    End, // end
    If, // if
    Then, // then
    Else, // else
    While, // while
    Do, // do
    For, // for
    To, // to
    Break, // break
    Nil, // nil
    Symbol, // var1
    Str, // "something"
    Number, // 1337
    OpenComen, // /*
    CloseComen, // */
    LineComen, // //
    Quote, // "
}

const tok: RawToken = RawToken.Point;

export const createToken = (tok: RawToken, position: Position, data?: any): Token => {
    return {
        token: tok,
        data,
        position,
    };
};

type TokenRegexMap = {
    [key in RawToken]: RegExp;
};

const tokenRegexMap: TokenRegexMap = {
    [RawToken.Point]: /^\.$/,
    [RawToken.Colon]: /^:$/,
    [RawToken.Assign]: /^:=$/,
    [RawToken.Comma]: /^,$/,
    [RawToken.Semicolon]: /^;$/,
    [RawToken.OpenParen]: /^\($/,
    [RawToken.CloseParen]: /^\)$/,
    [RawToken.OpenBracket]: /^\[$/,
    [RawToken.CloseBracket]: /^\]$/,
    [RawToken.OpenBraces]: /^{$/,
    [RawToken.CloseBraces]: /^}$/,
    [RawToken.Ampersand]: /^&$/,
    [RawToken.Pipe]: /^\|$/,
    [RawToken.Equals]: /^=$/,
    [RawToken.Lt]: /^<$/,
    [RawToken.Lte]: /^<=$/,
    [RawToken.Gt]: /^>$/,
    [RawToken.Gte]: /^>=$/,
    [RawToken.Neq]: /^<>$/,
    [RawToken.Plus]: /^\+$/,
    [RawToken.Minus]: /^\-$/,
    [RawToken.Times]: /^\*$/,
    [RawToken.Div]: /^\/$/,
    [RawToken.Type]: /^type$/,
    [RawToken.Array]: /^array$/,
    [RawToken.Of]: /^of$/,
    [RawToken.Var]: /^var$/,
    [RawToken.Function]: /^function$/,
    [RawToken.Let]: /^let$/,
    [RawToken.In]: /^in$/,
    [RawToken.End]: /^end$/,
    [RawToken.If]: /^if$/,
    [RawToken.Then]: /^then$/,
    [RawToken.Else]: /^else$/,
    [RawToken.While]: /^while$/,
    [RawToken.Do]: /^do$/,
    [RawToken.For]: /^for$/,
    [RawToken.To]: /^to$/,
    [RawToken.Break]: /^break$/,
    [RawToken.Nil]: /^nil$/,
    [RawToken.Symbol]: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    [RawToken.Str]: /^"[^"]*"$/, // NOT TRUE!!
    [RawToken.Number]: /^[0-9]+$/,
    [RawToken.OpenComen]: /^\/\*$/,
    [RawToken.CloseComen]: /^\*\/$/,
    [RawToken.LineComen]: /^\/\/$/,
    [RawToken.Quote]: /^"$/,
};

const tokenStringMap = {
    [RawToken.Point]: 'Point',
    [RawToken.Colon]: 'Colon',
    [RawToken.Assign]: 'Assign',
    [RawToken.Comma]: 'Comma',
    [RawToken.Semicolon]: 'Semicolon',
    [RawToken.OpenParen]: 'OpenParen',
    [RawToken.CloseParen]: 'CloseParen',
    [RawToken.OpenBracket]: 'OpenBracket',
    [RawToken.CloseBracket]: 'CloseBracket',
    [RawToken.OpenBraces]: 'OpenBraces',
    [RawToken.CloseBraces]: 'CloseBraces',
    [RawToken.Ampersand]: 'Ampersand',
    [RawToken.Pipe]: 'Pipe',
    [RawToken.Equals]: 'Equals',
    [RawToken.Lt]: 'Lt',
    [RawToken.Lte]: 'Lte',
    [RawToken.Gt]: 'Gt',
    [RawToken.Gte]: 'Gte',
    [RawToken.Neq]: 'Neq',
    [RawToken.Plus]: 'Plus',
    [RawToken.Minus]: 'Minus',
    [RawToken.Times]: 'Times',
    [RawToken.Div]: 'Div',
    [RawToken.Type]: 'Type',
    [RawToken.Array]: 'Array',
    [RawToken.Of]: 'Of',
    [RawToken.Var]: 'Var',
    [RawToken.Function]: 'Function',
    [RawToken.Let]: 'Let',
    [RawToken.In]: 'In',
    [RawToken.End]: 'End',
    [RawToken.If]: 'If',
    [RawToken.Then]: 'Then',
    [RawToken.Else]: 'Else',
    [RawToken.While]: 'While',
    [RawToken.Do]: 'Do',
    [RawToken.For]: 'For',
    [RawToken.To]: 'To',
    [RawToken.Break]: 'Break',
    [RawToken.Nil]: 'Nil',
    [RawToken.Symbol]: 'Symbol',
    [RawToken.Str]: 'Str',
    [RawToken.Number]: 'Number',
    [RawToken.OpenComen]: 'OpenComen',
    [RawToken.CloseComen]: 'CloseComen',
    [RawToken.LineComen]: 'LineComen',
    [RawToken.Quote]: 'Quote',
};

export const yieldableTokens = [
    RawToken.Point,
    RawToken.Colon,
    RawToken.Assign,
    RawToken.Comma,
    RawToken.Semicolon,
    RawToken.OpenParen,
    RawToken.CloseParen,
    RawToken.OpenBracket,
    RawToken.CloseBracket,
    RawToken.OpenBraces,
    RawToken.CloseBraces,
    RawToken.Ampersand,
    RawToken.Pipe,
    RawToken.Equals,
    RawToken.Lt,
    RawToken.Lte,
    RawToken.Gt,
    RawToken.Gte,
    RawToken.Neq,
    RawToken.Plus,
    RawToken.Minus,
    RawToken.Times,
    RawToken.Div,
    RawToken.Type,
    RawToken.Array,
    RawToken.Of,
    RawToken.Var,
    RawToken.Function,
    RawToken.Let,
    RawToken.In,
    RawToken.End,
    RawToken.If,
    RawToken.Then,
    RawToken.Else,
    RawToken.While,
    RawToken.Do,
    RawToken.For,
    RawToken.To,
    RawToken.Break,
    RawToken.Nil,
    RawToken.Symbol,
    RawToken.Str,
    RawToken.Number,
]

export const prettyPrintToken = (tok: Token): string => {
    const { token, position, data } = tok;
    return `${tokenStringMap[token]}${data ? `(${data})` : ''} at ${prettyPrintPosition(position)}`;
};

export const tokenFromString = (str: string, pos: Position): Token => {
    const entry = Object.entries(tokenRegexMap).find(([tok, regex]) => {
        return regex.test(str);
    });

    if (!entry) {
        return null;
    }

    const tok: RawToken = Number(entry[0]);
    const data = dataFromToken(tok, str);
    return createToken(tok, pos, data);
};

const dataFromToken = (tok: RawToken, str: string): any => {
    switch (tok) {
        case RawToken.Number:
            return Number(str);

        case RawToken.Symbol:
            return str;

        case RawToken.Str:
            return str;

        default:
            return null;
    }
};
