declare module 'xterm' {
  export interface ITerminalOptions {
    cursorBlink?: boolean;
    cursorStyle?: 'bar' | 'block' | 'underline';
    fontSize?: number;
    fontFamily?: string;
    theme?: ITheme;
    allowTransparency?: boolean;
    scrollback?: number;
  }

  export interface ITheme {
    background?: string;
    foreground?: string;
    cursor?: string;
    cursorAccent?: string;
    selectionBackground?: string;
    black?: string;
    red?: string;
    green?: string;
    yellow?: string;
    blue?: string;
    magenta?: string;
    cyan?: string;
    white?: string;
    brightBlack?: string;
    brightRed?: string;
    brightGreen?: string;
    brightYellow?: string;
    brightBlue?: string;
    brightMagenta?: string;
    brightCyan?: string;
    brightWhite?: string;
  }

  export interface IDisposable {
    dispose(): void;
  }

  export class Terminal {
    constructor(options?: ITerminalOptions);
    open(element: HTMLElement): void;
    write(data: string): void;
    writeln(data: string): void;
    clear(): void;
    dispose(): void;
    focus(): void;
    reset(): void;
    onData(callback: (data: string) => void): IDisposable;
    onKey(callback: (event: { key: string; domEvent: KeyboardEvent }) => void): IDisposable;
    loadAddon(addon: any): void;
  }
}

declare module 'xterm-addon-fit' {
  export class FitAddon {
    fit(): void;
    proposeDimensions(): { cols: number; rows: number } | undefined;
  }
}

declare module 'xterm/css/xterm.css';
