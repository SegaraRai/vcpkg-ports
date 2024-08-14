import { renderMarkdownSubset } from "./mdSubset.mjs";

type State = "code" | "text";

function removeIndent(line: string, indent: string): string {
  return indent && line.startsWith(indent) ? line.slice(indent.length) : line;
}

export type Lang = "cmake" | "cpp" | "plaintext";

export type Chunk =
  | {
      readonly type: "code";
      readonly lang: Lang;
      readonly code: string;
    }
  | {
      readonly type: "text";
      readonly html: string;
    };

export function renderUsage(
  portName: string,
  usageSource: string
): readonly Chunk[] {
  const lines = usageSource
    .replaceAll("@PORT@", portName)
    .replaceAll("@TARGET_TRIPLET@", "<TARGET_TRIPLET>")
    .replaceAll("@CURRENT_INSTALLED_DIR@", "<CURRENT_INSTALLED_DIR>")
    .split("\n");

  const result: Chunk[] = [];
  const sink: string[] = [];
  const addToResult = (type: State, lang: Lang = "plaintext") => {
    if (type === "text") {
      const content = sink
        .join("")
        .trim()
        .replace(/(<br\s*\/?>\s*)+$/, "");
      if (content) {
        result.push({ type: "text", html: content });
      }
    } else {
      result.push({ type: "code", lang, code: sink.join("").trim() });
    }
    sink.splice(0);
  };

  let lang: Lang = "plaintext";
  let state: State = "text";
  let codeIndent = "";
  for (const line of lines) {
    let newState: State = state;
    if (/^\s*or\s*$/i.test(line) || /^\s*https?:\/\//.test(line)) {
      newState = "text";
    } else if (
      /^\s+[a-z]/.test(line) ||
      /^\s*(#|find_package|include_directories|target_link_libraries)/i.test(
        line
      )
    ) {
      newState = "code";
    } else if (/^\S/.test(line)) {
      newState = "text";
    }

    if (newState !== state) {
      addToResult(state, lang);
      if (newState === "code") {
        lang = /^\s*#(define|undef|if|ifn?def|else|elif|include|pragma)\s/.test(
          line
        )
          ? "cpp"
          : "cmake";
        codeIndent = line.match(/^\s+/)?.[0] ?? "";
      }
    }

    if (newState === "code") {
      sink.push(
        removeIndent(line, codeIndent).replace(/#\s+/, "# ").trimEnd() + "\n"
      );
    } else {
      sink.push(renderMarkdownSubset(line.trim()) + "<br />\n");
    }

    state = newState;
  }

  addToResult(state, lang);

  return result;
}
