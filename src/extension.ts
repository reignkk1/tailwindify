import * as vscode from "vscode";
import { twi } from "tw-to-css";
import { CssToTailwindTranslator } from "css-to-tailwind-translator";
import { toCssRule } from "./utils.js";

export function activate(context: vscode.ExtensionContext) {
  let matchTag: RegExpExecArray | null;
  let editorInitialValue: string;

  const hoverProvider = vscode.languages.registerHoverProvider(
    [
      {
        scheme: "file",
        language: "html",
      },
      { scheme: "file", language: "javascriptreact" },
      { scheme: "file", language: "typescriptreact" },
    ],
    {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        const word = range ? document.getText(range) : "";
        const lineText = document.lineAt(position.line).text;

        const tagPattern = /<([A-Za-z][A-Za-z0-9-]*)/g;
        matchTag = tagPattern.exec(lineText);
        if (matchTag !== null) {
          if (matchTag[1] === word) {
            // 여기 부분이 시작 태그에 hover하면 실행되는 곳
            if (lineText.includes("<") && lineText.includes(">")) {
              // 모든 속성들이 다 존재한다.

              if (lineText.includes("class")) {
                // 그 중에서 class속성이 있다면
                const classPattern = /(class|className)=(['"])([^'"]+)\2/;
                const matchClass = classPattern.exec(lineText);
                if (matchClass) {
                  editorInitialValue = matchTag
                    ? toCssRule(matchTag[1], matchClass[3])
                    : "/* 새 스타일 작성 */";
                }
              }
            } else if (lineText.includes("<") && !lineText.includes(">")) {
              // 속성값이 많거나 길다면
              let pline = position.line + 1;

              const attr: string[] = [];

              while (!document.lineAt(pline).text.includes(">")) {
                if (document.lineAt(pline).text.includes("class")) {
                  attr.push(document.lineAt(pline).text);
                  break;
                }
                pline++;
              }

              editorInitialValue = matchTag
                ? toCssRule(matchTag[1], twi(attr[0].split("=")[1]))
                : "/* 새 스타일 작성 */";
            }
            const markdown = new vscode.MarkdownString(
              `[CSS 편집기 열기](command:extension.openCssEditor)`
            );
            markdown.isTrusted = true;
            return new vscode.Hover(markdown);
          }
        }

        return null;
      },
    }
  );

  const openCssEditor = vscode.commands.registerCommand(
    "extension.openCssEditor",
    () => {
      const modalPanel = vscode.window.createWebviewPanel(
        "cssEditor",
        "CSS Editor",
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true }
      );

      modalPanel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>CSS Editor</title>
          <style>
            body, html { margin:0; padding:0; height:100%; }
            #editor { width:100%; height:90%; }
            #btn { width:100%; height:10%; font-size:16px; }
          </style>
        </head>
        <body>
          <div id="editor"></div>
          <button id="btn">변환</button>

          <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.38.0/min/vs/loader.js"></script>
          <script>
            const vscode = acquireVsCodeApi();

            require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.38.0/min/vs' }});
            require(['vs/editor/editor.main'], function() {
              const editor = monaco.editor.create(document.getElementById('editor'), {
                value: \`${editorInitialValue}\`,
                language: 'scss',
                theme: 'vs-dark',
                automaticLayout: true,
              });

              document.getElementById('btn').addEventListener('click', () => {
                const css = editor.getValue();
                vscode.postMessage({ css });
              });
            });
          </script>
        </body>
        </html>
      `;

      modalPanel.webview.onDidReceiveMessage((msg) => {
        console.log(CssToTailwindTranslator(msg.css).data[0].resultVal);
      });
    }
  );

  context.subscriptions.push(hoverProvider, openCssEditor);
}

export function deactivate() {}
