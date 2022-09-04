export enum OP {
    PUSH = 0,
    ADD = 1,
    DISPLAY = 2,
}

export interface Compiled {
    id: number;
    op: OP;
    operand?: number;
    label: string;
    stack: number[];
    execute?: () => void;
}

export const syntax: Record<OP, string> = {
    [OP.PUSH]: 'POUSSE',
    [OP.ADD]: 'SOMME',
    [OP.DISPLAY]: 'AFFICHE',
} as const

// @ts-ignore
export const reverseSyntax: Record<string, OP> = Object.fromEntries(
    Object.entries(syntax).map(([key, value]) => [value, ~~key])
);
