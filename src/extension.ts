import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
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

        if (word === "div") {
          const markdown = new vscode.MarkdownString(
            `[CSS 편집기 열기](command:extension.openCssEditor)`
          );
          markdown.isTrusted = true;
          return new vscode.Hover(markdown);
        }

        return null;
      },
    }
  );

  const openCssEditor = vscode.commands.registerCommand(
    "extension.openCssEditor",
    async () => {
      const doc = await vscode.workspace.openTextDocument({
        language: "css",
        content: "/* 여기에 CSS 작성 */",
      });
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    }
  );

  context.subscriptions.push(hoverProvider, openCssEditor);
}

export function deactivate() {}
