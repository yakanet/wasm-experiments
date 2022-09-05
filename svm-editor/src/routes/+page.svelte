<script lang="ts">
    import { fly } from "svelte/transition";

    import { type Compiled, OP, syntax, reverseSyntax } from "$lib/model.js";

    let formatAssembly = false;
    let formatHex = false;
    let runningIndex = -1;
    let source: string = `${syntax[OP.PUSH]} 12
${syntax[OP.PUSH]} 23
${syntax[OP.PUSH]} 48
${syntax[OP.ADD]}
${syntax[OP.ADD]}
${syntax[OP.DISPLAY]}`;
    let compiled: Compiled[] = [];

    $: {
        const fn = compiled[runningIndex - 1]?.execute;
        if (fn) setTimeout(fn, 1);
    }

    function* compile(source: string): Iterable<Compiled> {
        runningIndex = -1;
        const tokens = source.split(/\s+/g)[Symbol.iterator]();
        const stack: number[] = [];
        let id = 0;
        while (true) {
            const token = tokens.next();
            if (token.done) break;
            const op = reverseSyntax[token.value];
            switch (op) {
                case OP.ADD: {
                    stack.push((stack.pop()!! + stack.pop()!!) & 0xff);
                    yield {
                        id: id++,
                        op,
                        label: syntax[op],
                        stack: [...stack],
                    };
                    break;
                }
                case OP.DISPLAY: {
                    const writeData = stack.pop();
                    yield {
                        id: id++,
                        op,
                        label: syntax[op],
                        stack: [...stack],
                        execute: () => alert(writeData),
                    };
                    break;
                }
                case OP.PUSH: {
                    const operand = parseInt(tokens.next().value) & 0xff;
                    stack.push(operand);
                    yield {
                        id: id++,
                        op,
                        label: syntax[op],
                        operand,
                        stack: [...stack],
                    };
                    break;
                }
            }
        }
    }

    const formatNumber = (value: number, toHex: boolean) =>
        value.toString(toHex ? 16 : 2).padStart(toHex ? 2 : 8, "0");
</script>

<main>
    <fieldset class="grammar">
        <legend>Machine Virtuelle</legend>
        <dl style="display: flex; flex-direction:column; gap: 5px">
            <dt>
                <code>{syntax[OP.PUSH]}</code> (OP {formatNumber(
                    OP.PUSH,
                    true
                )})
            </dt>
            <dd>Pousse le nombre (0-255) qui arrive après sur la stack</dd>
            <dt>
                <code>{syntax[OP.ADD]}</code> (OP {formatNumber(OP.ADD, true)})
            </dt>
            <dd>
                Consomme deux nombres sur la stack, les additionne, et pousse le
                résultat sur la stack
            </dd>
            <dt>
                <code>{syntax[OP.DISPLAY]}</code> (OP {formatNumber(
                    OP.DISPLAY,
                    true
                )})
            </dt>
            <dd>Prend le nombre qui est sur la stack et l'affiche</dd>
        </dl>
    </fieldset>
    <fieldset class="source">
        <legend>Source (Langage Imaginaire)</legend>
        <textarea aria-label="Source code" bind:value={source} />
        <div>
            <button
                on:click={() => {
                    runningIndex = -1;
                    compiled = [...compile(source)];
                }}>Compile</button
            >
        </div>
    </fieldset>

    <fieldset
        class="assembly"
        style="visibility: {compiled.length ? 'initial' : 'hidden'}"
    >
        <legend>Assembly</legend>
        <div
            style="display: flex; flex-wrap: wrap; align-content: baseline;"
            style:gap={formatAssembly ? "0" : "5px"}
            style:flex-direction={formatAssembly ? "column" : "row"}
        >
            {#each compiled as { id, op, operand, label }}
                <code
                    class:fullline={formatAssembly}
                    title={`${label} ${operand ?? ""}`}
                    class:highlighted={runningIndex === id}
                >
                    {formatNumber(op, formatHex)}
                    {#if operand !== undefined}
                        {formatNumber(operand, formatHex)}
                    {/if}
                </code>
            {/each}
        </div>
        <div style="display: flex">
            <label>
                <input type="checkbox" bind:checked={formatHex} />
                Hex
            </label>
            <label>
                <input type="checkbox" bind:checked={formatAssembly} />
                Format
            </label>
            <label style="flex: 1; text-align: right">
                Position
                <input
                    style="text-align: right;"
                    type="number"
                    min="-1"
                    max={compiled.length}
                    bind:value={runningIndex}
                />
            </label>
        </div>
    </fieldset>

    <fieldset
        class="stack"
        style="overflow: hidden"
        style:visibility={compiled.length ? "initial" : "hidden"}
    >
        <legend>Stack</legend>
        <ul
            style="display: flex; position: absolute; list-style: none; flex-direction: column-reverse;"
        >
            {#if runningIndex > 0}
                {#each compiled.at(runningIndex - 1)?.stack ?? [] as item (item)}
                    <li in:fly|local={{ y: -20 }}>
                        {item}
                    </li>
                {/each}
            {/if}
        </ul>
    </fieldset>
</main>

<style>
    main {
        width: 100vmax;
        height: 100vmin;
        display: grid;
        grid-template-areas:
            "G C C"
            "G A S";
        grid-template-columns: 30vw 1fr 10vw;
        grid-template-rows: 1fr 1fr;
    }
    @media screen and (min-width: 1115px) and (max-width: 1399px) {
        main > * {
            zoom: 1.5;
        }
    }
    @media screen and (min-width: 1400px) {
        main > * {
            zoom: 2;
        }
    }
    .grammar {
        grid-area: G;
    }
    .source {
        grid-area: C;
        display: flex;
        flex-direction: column;
    }
    .assembly {
        grid-area: A;
        display: grid;
        grid-auto-rows: 1fr min-content;
    }
    .stack {
        grid-area: S;
    }

    .source > textarea {
        flex: 1;
        font-family: monospace;
        font-size: 0.8rem;
        white-space: pre;
        width: 100%;
        border: 0;
        outline: none;
    }
    code.fullline {
        width: 100%;
    }
    code.highlighted {
        background-color: #3390ff;
        color: white;
    }
    code[title] {
        position: relative;
        white-space: nowrap;
        border: 1px solid transparent;
        align-self: baseline;
    }
    code[title]:hover {
        border: 1px solid blue;
    }
    code[title]:hover::after {
        user-select: none;
        content: attr(title);
        position: absolute;
        white-space: nowrap;
        top: calc(-100% - 3px);
        left: 0;
        color: black;
        background-color: beige;
        border: 1px solid black;
        z-index: 1;
    }
    ul,
    dl {
        margin: 0;
        padding: 0;
    }
</style>
