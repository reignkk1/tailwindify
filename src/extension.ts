import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let matchTag: RegExpExecArray | null;

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

        // </div> 이런 형태의 태그는 거르고 시작 태그 <div> 이런 형태의 태그만 추출
        // 만약 한줄에 속성이 많아지면 <div 이렇게 끊길수 있기에 다음 라인을 계속 탐색

        const tagPattern = /<\/?([A-Za-z][A-Za-z0-9-]*)/g;
        matchTag = tagPattern.exec(lineText);
        if (matchTag !== null) {
          if (matchTag[1] === word) {
            // 여기 부분이 시작 태그에 hover하면 실행되는 곳
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

      const initialValue = matchTag
        ? `${matchTag[1]} {\n  /* 여기에 CSS 작성 */\n}`
        : "/* 새 스타일 작성 */";

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
                value: \`${initialValue}\`,
                language: 'css',
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
        console.log(msg.css);
      });
    }
  );

  context.subscriptions.push(hoverProvider, openCssEditor);
}

export function deactivate() {}
