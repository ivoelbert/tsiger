export type Position = {
    line: number;
    column: number;
};

export const prettyPrintPosition = (pos: Position): string => {
    return `[${pos.line + 1}, ${pos.column + 1}]`;
};
