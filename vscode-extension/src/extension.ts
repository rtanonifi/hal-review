import * as vscode from 'vscode';


export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('hal.start', () => {
			HalPanel.createOrShow(context.extensionUri);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(HalPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				HalPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		// FIXME:  Restrict to workspace/.hal and extension/media/

		// localResourceRoots: [
		// 	vscode.Uri.joinPath(extensionUri, 'media')
		// ]
	};
}

/**
 * Manages cat coding webview panels
 */
class HalPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: HalPanel | undefined;

	public static readonly viewType = 'hal';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (HalPanel.currentPanel) {
			HalPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			HalPanel.viewType,
			'HAL Core',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		HalPanel.currentPanel = new HalPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		HalPanel.currentPanel = new HalPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		// this._panel.webview.onDidReceiveMessage(
		// 	message => {
		// 		switch (message.command) {
		// 			case 'alert':
		// 				vscode.window.showErrorMessage(message.text);
		// 				return;
		// 		}
		// 	},
		// 	null,
		// 	this._disposables
		// );
	}

	// public doRefactor() {
	// 	// Send a message to the webview webview.
	// 	// You can send any JSON serializable data.
	// 	this._panel.webview.postMessage({ command: 'refactor' });
	// }

	public dispose() {
		HalPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async _update() {
		const webview = this._panel.webview;

		this._panel.title = "HAL Core";
		this._panel.webview.html = await this._getHtmlForWebview(webview);
	}



	private async _getHtmlForWebview(webview: vscode.Webview) {

		const baseUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media').with({ scheme: 'vscode-resource' }));

		// Local path to main script run in the webview
		const localScriptPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'static', 'js', 'main.js');
		const localStylePath = vscode.Uri.joinPath(this._extensionUri, 'media', 'static', 'css', 'main.css');
		const loaderPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vs', 'loader.js');
		const localVsPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vs');

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(localScriptPath);
		const styleUri = webview.asWebviewUri(localStylePath);
		const loaderUri = webview.asWebviewUri(loaderPath);
		const vsUri = webview.asWebviewUri(localVsPath);

		// Local path to css styles
		// const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
		// const styleVsCodePath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');

		// Uri to load styles into webview
		// const stylesResetUri = webview.asWebviewUri(styleResetPath);
		// const stylesVsCodeUri = webview.asWebviewUri(styleVsCodePath);

		// load additional JS extensions from workspace
		const jsFiles = await vscode.workspace.findFiles('.hal/load/*.js', '**/node_modules/**');

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		// TODO:

		// Since we only allow local resources, absolute path for styles/images (e.g., /static/media/logo.svg) will not work. 
		// We add a .env file which sets PUBLIC_URL to ./ and after bundling, resource urls will be relative.

		const html = `<!doctype html>
		<html lang="en">
		
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			<meta name="theme-color" content="#000000" />
			<meta name="description" content="HAL" />
			<!--
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
			-->
			<base href="${baseUri}/">
			<title>HAL</title>
			<script>var exports = {};</script>
			<script nonce="${nonce}" type="text/javascript" src="${loaderUri}"></script>
			<script>
				window.__monacoLoadUri = "${vsUri}"
			</script>
			<script nonce="${nonce}" defer="defer" src="${scriptUri}"></script>
			<link href="${styleUri}" rel="stylesheet">

			<!-- ------------- Custom JS ------------- -->
			${jsFiles.map(uri => `<script nonce="${nonce}" type="module" defer="defer" src="${webview.asWebviewUri(uri)}"></script>`).join("\n\n\t")}

		</head>
		
		<body><noscript>You need to enable JavaScript to run HAL Core.</noscript>
			<div id="root"></div>
		</body>
		
		</html>`;

		console.log(html);
		return html;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
