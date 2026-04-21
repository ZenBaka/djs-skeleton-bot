/**
 * A mutable string buffer with a fluent API. Useful for multi-line
 * messages, help text, and anywhere you'd otherwise write a pile of
 * `let s = ''; s += ...; s += ...;`.
 *
 * Backed internally by an array that gets joined on toString(), so
 * appending many small pieces doesn't re-allocate the whole string
 * each time. Length and empty checks are O(1).
 */
export default class StringBuilder {
  private parts: string[] = [];
  private _length = 0;
  private _lastChar = '';

  constructor(initial?: string) {
    if (initial !== undefined && initial.length > 0) {
      this.append(initial);
    }
  }

  /** Current length in characters. O(1). */
  public get length(): number {
    return this._length;
  }

  /** True if nothing has been appended (or after clear()). */
  public get isEmpty(): boolean {
    return this._length === 0;
  }

  /** Append a string. Empty strings are no-ops. */
  public append(str: string): this {
    if (str.length === 0) return this;
    this.parts.push(str);
    this._length += str.length;
    this._lastChar = str[str.length - 1]!;
    return this;
  }

  /** Append a string followed by a newline. Call with no arg for just a newline. */
  public appendLine(str: string = ''): this {
    return this.append(str).append('\n');
  }

  /** Append multiple lines at once. Each item gets its own newline. */
  public appendLines(lines: readonly string[]): this {
    for (const line of lines) this.appendLine(line);
    return this;
  }

  /** Append only if condition is truthy. Handy for optional fields. */
  public appendIf(condition: unknown, str: string): this {
    if (condition) this.append(str);
    return this;
  }

  /** Append a line only if condition is truthy. */
  public appendLineIf(condition: unknown, str: string): this {
    if (condition) this.appendLine(str);
    return this;
  }

  /** Join an array of strings with a separator and append the result. */
  public appendJoin(separator: string, items: readonly string[]): this {
    for (let i = 0; i < items.length; i++) {
      if (i > 0) this.append(separator);
      this.append(items[i]!);
    }
    return this;
  }

  /**
   * Append a line prefixed by `depth` copies of the indent string.
   * Defaults to two spaces per level. Pass '\t' or a custom string
   * for tabs or different widths.
   */
  public indent(depth: number, str: string, indentStr: string = '  '): this {
    return this.appendLine(indentStr.repeat(Math.max(0, depth)) + str);
  }

  /** Append a newline only if the buffer doesn't already end in one. */
  public ensureNewline(): this {
    if (this._length > 0 && this._lastChar !== '\n') {
      this.append('\n');
    }
    return this;
  }

  /**
   * Strip trailing whitespace from the buffer. Useful when you've been
   * building content with appendLine between sections and don't want
   * a trailing newline on the final output.
   */
  public trimEnd(): this {
    if (this._length === 0) return this;
    const trimmed = this.toString().trimEnd();
    this.clear();
    if (trimmed.length > 0) this.append(trimmed);
    return this;
  }

  /** Reset the buffer to empty. */
  public clear(): this {
    this.parts = [];
    this._length = 0;
    this._lastChar = '';
    return this;
  }

  /** Materialize the buffer into a single string. Does not clear. */
  public toString(): string {
    return this.parts.join('');
  }
}