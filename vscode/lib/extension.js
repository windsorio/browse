"use strict";

const vscode = require("vscode");
const formatter = require("@browselang/format");

const BROWSE_MODE = { scheme: "file", language: "browse" };

class BrowseDocumentFormatter {
  constructor({ outputChannel }) {
    this.outputChannel = outputChannel;
  }

  async provideDocumentRangeFormattingEdits(document, range, options, token) {
    return this.provideEdits(document, {
      rangeEnd: document.offsetAt(range.end),
      rangeStart: document.offsetAt(range.start),
    });
  }

  async provideDocumentFormattingEdits(document, options, token) {
    return this.provideEdits(document);
  }

  async provideEdits(document, options) {
    const hrStart = process.hrtime();
    const result = await this.format(document.getText(), document, options);
    if (!result) {
      // No edits happened, return never so VS Code can try other formatters
      return [];
    }
    const hrEnd = process.hrtime(hrStart);
    this.outputChannel.appendLine(
      `Formatting completed in ${hrEnd[1] / 1000000}ms.`
    );
    return [vscode.TextEdit.replace(this.fullDocumentRange(document), result)];
  }

  /**
   * Format the given text with user's configuration.
   * @param text Text to format
   * @param path formatting file's path
   * @returns {string} formatted text
   */
  async format(
    text,
    { fileName, languageId, uri, isUntitled },
    rangeFormattingOptions = {}
  ) {
    this.outputChannel.appendLine(`Formatting ${fileName}`);

    // const vscodeConfig = getConfig(uri);

    // const ignorePath = this.ignoreResolver.getIgnorePath(fileName);

    // let fileInfo;
    // if (fileName) {
    //   fileInfo = await formatter.getFileInfo(fileName, {
    //     ignorePath,
    //     resolveConfig: true,
    //     withNodeModules: false,
    //   });
    //   // this.outputChannel.appendLine("File Info:", fileInfo);
    // }

    // if (fileInfo && fileInfo.ignored) {
    //   // this.outputChannel.appendLine("File is ignored, skipping.");
    //   // this.statusBarService.updateStatusBar(FormattingResult.Ignore);
    //   return;
    // }

    const parser = "browse";

    try {
      const formattedText = formatter.format(text, {
        parser: "browse",
        plugins: [],
        ...rangeFormattingOptions,
      });
      // this.statusBarService.updateStatusBar(FormattingResult.Success);

      this.outputChannel.appendLine("Formatted document.");
      return formattedText;
    } catch (error) {
      this.outputChannel.appendLine("Error formatting document.", error);
      // this.statusBarService.updateStatusBar(FormattingResult.Error);

      return text;
    }
  }

  fullDocumentRange(document) {
    const lastLineId = document.lineCount - 1;
    return new vscode.Range(
      0,
      0,
      lastLineId,
      document.lineAt(lastLineId).text.length
    );
  }
}

exports.activate = function (context) {
  const outputChannel = vscode.window.createOutputChannel("Browse");

  const formatProvider = new BrowseDocumentFormatter({ outputChannel });

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      BROWSE_MODE,
      formatProvider
    ),
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      BROWSE_MODE,
      formatProvider
    )
  );
};
