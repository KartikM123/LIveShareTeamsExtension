// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as vsls from 'vsls/vscode';
//import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';
//import * as Msal from "msal";
import { UserAgentApplication } from "msal";
import { ImplicitMSALAuthenticationProvider } from "@microsoft/microsoft-graph-client/lib/src/ImplicitMSALAuthenticationProvider";
//import { Client } from "@microsoft/microsoft-graph-client";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-client";
import secrets from "./secrets.json";
import {Team, PopulateTree} from "./TreeProvider";

//Interface with LiveShare API
let liveshare: vsls.LiveShare;

//Authenticate for MSGraph API
let client: MicrosoftGraph.Client;

//Register VSCode Commands
const disposables: vscode.Disposable[] = [];

//Required for manual auth
const CLIENT_ID = "bd235050-03e5-4972-8bc5-d54115189856";
const DIRECTORY_ID = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const OBJECT_ID = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const REDIRECT_URI = "https://localhost";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	console.log('Congratulations, your extension "helloworld" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let newdisposable = vscode.commands.registerCommand('<Your_Command_Name>', () => {
		vscode.window.showInformationMessage('New Message!');
	});

	let disposable = vscode.commands.registerCommand('lstest.LS', () => {

		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Message wow!');
		liveShareWorkflow(secrets.teamid, secrets.channelid);
		vscode.window.showInformationMessage('After');

	});

	let disposable2 = vscode.commands.registerCommand('lstest.TS', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Starting teams workflow!');
		teamsMessage("Sample Message");

	});
	
	let disposable3 = vscode.commands.registerCommand('simpleStart', () => {
		console.log("Started!");
	})

	vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Team) => {
		vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`)
		if (node.isChild){
		liveShareWorkflow(node.teamid, node.id);
		}else{
			console.log("No affect bc parent flow");
		}
	});


	vscode.window.registerTreeDataProvider('chatList', new PopulateTree(secrets.accessToken));

	context.subscriptions.push(disposable, disposable2, disposable3);
}

async function teamsMessage(msg: string){
	await initClient();
	console.log(msg);
}


async function initClient(){
	client = MicrosoftGraph.Client.init({
		defaultVersion: "v1.0",
		debugLogging: true,
		authProvider: (done) => {
			done(null, secrets.accessToken);
		},
	});
	//messageGroup(secrets.teamid, secrets.channelid, "Sample")
	//sendEmail("sample message", "t-kamah@microsoft.com");
	listTeams();
	//listChannel(secrets.teamid);
	//listUserIDFromChannel(secrets.teamid, secrets.channelid);
	//messageIndividual(secrets.damanid, "SampleMessage");

}
async function getUserID(email: string){
	try{
		let res = await client.api("/users/" + email)
		.get();

		//Temporary, fill this with the result value that you want to send to 
		console.log(res.displayName);
		console.log(res.id)
	} catch (error) {
		throw error;
	}
}
async function listTeams(){
	try{
		console.log("Recieving Teams");
		let res = await client.api("/me/joinedTeams")
		.get();

		console.log("teams read")

		//Temporary, fill this with the result value that you want to send to 
		for (let i = 0; i < res.value.length; i++){
			console.log(res.value[i].displayName);
			console.log(res.value[i].id);

		}
	} catch (error) {
		console.log("Here :(")
		throw error;
	}
}
async function listChannel(groupID:string){
	let request = '/teams/' + groupID+ '/channels';
	try{
		let res = await client.api(request)
		.get();

		//Temporary, fill this with the result value that you want to send to 
		for (let i = 0; i < res.value.length; i++){
			console.log(res.value[i].displayName);
			console.log(res.value[i].userId);

		}
	} catch (error) {
		throw error;
	}
}
async function listUserIDFromChannel (groupID:string, channelID:string){
		let request = '/teams/' + groupID + '/channels/' + channelID + '/members';
		try{
			let res = await client.api(request)
			.version('beta')
			.get();

			//Temporary, fill this with the result value that you want to send to 
			for (let i = 0; i < res.value.length; i++){
				console.log(res.value[i].displayName);
				console.log(res.value[i].id);

			}
		} catch (error) {
			throw error;
		}
	
	
}
async function messageIndividual(userID:string, msg: string) {
	let request = '/chats/' + userID + '/messages';
	const message = {
		body:{
			content: msg
		}
	}
	try{
		let res = await client.api(request)
		.version('beta')
		.post(msg);
	} catch (error) {
		throw error;
	}

}

async function messageGroup(groupID:string, channelID:string, msg: string) {
	client = MicrosoftGraph.Client.init({
		defaultVersion: "v1.0",
		debugLogging: true,
		authProvider: (done) => {
			done(null, secrets.accessTokenMsg);
		},
	});
	const message = {
		body:{
			content: msg
		}
	}
	let request = '/teams/' + groupID + '/channels/' + channelID + '/messages';
	console.log(request);
	console.log("Sending Message");
	let res;
	
	try{
		res = await client.api('/teams/' + groupID + '/channels/' + channelID + '/messages')
		.version('beta')
		.post(message);
	}catch (error) {
		throw error;
	}

	console.log("Sent message");

}

async function sendEmail(message: string,email: string){
	console.log("Constructing Email");

	// Construct email object
	const mail = {
		subject: "Microsoft Graph JavaScript Sample",
		toRecipients: [
			{
				emailAddress: {
					address: email,
				},
			},
		],
		body: {
			contentType: "Text",
			content: message,
		},
	};
	console.log("Sending Email");

	try {
		let response = await client.api("/me/sendMail").post({ message: mail });
		console.log("successfully sent message!")
		console.log(response.toString());
	} catch (error) {
		throw error;
	}
}

async function persistentAPI(){
	//https://github.com/microsoftgraph/msgraph-sdk-javascript
	//https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-core#installation
	console.log("Explore Client");
	const msalConfig = {
		auth: {
			clientId: CLIENT_ID, // Client Id of the registered application
			redirectUri: REDIRECT_URI
		},
	};

	const graphScopes = ["user.read", "mail.send"]; // An array of graph scopes
	
	// Important Note: This library implements loginPopup and acquireTokenPopup flow, remember this while initializing the msal
	// Initialize the MSAL @see https://github.com/AzureAD/microsoft-authentication-library-for-js#1-instantiate-the-useragentapplication
	console.log("User App Client");
	const msalApplication = new UserAgentApplication(msalConfig);
	
	console.log("starting authentication");
	const options = new MicrosoftGraph.MSALAuthenticationProviderOptions(graphScopes);
	const authProvider = new ImplicitMSALAuthenticationProvider(msalApplication, options);
	const configOptions = {authProvider,};
	const Client = MicrosoftGraph.Client;
	const client = Client.initWithMiddleware(configOptions);

	console.log("Constructing Email");

	// Construct email object
	const mail = {
		subject: "Microsoft Graph JavaScript Sample",
		toRecipients: [
			{
				emailAddress: {
					address: "t-kamah@microsoft.com",
				},
			},
		],
		body: {
			contentType: "Text",
			content: "<h1>MicrosoftGraph JavaScript Sample</h1>Check out https://github.com/microsoftgraph/msgraph-sdk-javascript",
		},
	};
	console.log("Sending Email");

	try {
		let response = await client.api("/me/sendMail").post({ message: mail });
		console.log(response);
	} catch (error) {
		throw error;
	}

}

async function liveShareWorkflow(teamID: string, channelID: string) {

	console.log("Initialized LiveShare workflow");

	const liveShareorNull = await vsls.getApi();
	if (!liveShareorNull) {
		console.error('Error getting Live Share API');
		return;
	} else {
		console.log("Successfully retrieved Live Share API");
	}	
	
	liveshare = liveShareorNull!;
	
	//print event on session
	liveshare.onDidChangeSession(async (e: vsls.SessionChangeEvent) => {
		console.log("Session Changed")
		vscode.window.showInformationMessage("Session Role " + e.session.role);

	}, null, disposables); 

	createLiveshareSession(teamID, channelID);


}

async function createLiveshareSession(teamID: string, channelID: string){
	const newSession = await liveshare.share();
	if(newSession){
		//console.log("Successfully shared new Session");
		//console.log(newSession.toString())
		vscode.window.showInformationMessage(newSession.toString());
		messageGroup(teamID, channelID, newSession.toString());
	} else {
		console.log("Failed")
	}
	console.log("Finished workflow");
}
// this method is called when your extension is deactivated
export function deactivate() {}
