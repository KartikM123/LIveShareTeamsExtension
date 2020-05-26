import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as vsls from 'vsls/vscode';
import { UserAgentApplication } from "msal";
import { ImplicitMSALAuthenticationProvider } from "@microsoft/microsoft-graph-client/lib/src/ImplicitMSALAuthenticationProvider";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-client";
import secrets from "./secrets.json";
import { version } from 'os';


export class PopulateTree implements vscode.TreeDataProvider<Team> {
    constructor(private access_token: string) {}
    
    private _onDidChangeTreeData: vscode.EventEmitter<Team | undefined> = new vscode.EventEmitter<Team | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Team | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        //this._onDidChangeTreeData.fire(); 
    }
	getTreeItem(element: Team): vscode.TreeItem {
        console.log("Getting Tree Item!");
		return element;
    }
    
    getChildren(element?: Team | undefined): Thenable<Team[]> {

        console.log("Getting Children!");
        let test = false;
        let allTeams: Team[] = [];
        if (element){
            console.log("Child flow for " +element.teamid + " " + element.label);
            if (test){
                let child = new Team("Sample_Child",
                "Sample_Child_id",
                "Parent_id", 
                true,
                vscode.TreeItemCollapsibleState.None);

                allTeams.push(child);

                console.log("ending early!")
                return Promise.resolve(allTeams);
            }
            return this.listChannel(element.teamid).then((res) => {
                console.log("Populating Children");
                for (let i = 0; i < res.value.length; i++){
                    let newm = new Team(
                        res.value[i].displayName,
                        res.value[i].id,
                        element.id, 
                        true,
                        vscode.TreeItemCollapsibleState.None
                    );
                    newm.contextValue="child";
                    allTeams.push(newm);
                }
                return Promise.resolve(allTeams);
            });
        } if (!element) {
            console.log("Parent flow");
                let parent = new Team("TestParent",
                "Sample_Node_id",
                "Sample_Node_id", // because current is parent
                false,
                vscode.TreeItemCollapsibleState.Collapsed);
                allTeams.push(parent);

                
                console.log("ending early!")
                return Promise.resolve(allTeams);
            }

            return this.listTeams().then((res) => {
                console.log(res);
                    console.log("Finished listing") 
                    let count = 0;
                    
                    for (let i = 0; i < res.value.length; i ++){
                        allTeams.push(new Team(res.value[i].displayName,
                            res.value[i].id,
                            res.value[i].id, 
                            false,
                            vscode.TreeItemCollapsibleState.Collapsed));
                    }
                    console.log("Done here!");
                    return Promise.resolve(allTeams);
            });
    }

    async listTeams(){
        let client = MicrosoftGraph.Client.init({
            defaultVersion: "v1.0",
            debugLogging: true,
            authProvider: (done) => {
                done(null, secrets.accessToken);
            },
        });
        console.log("Getting Teams")
        return client.api("/me/joinedTeams")
        .get().then((res) => {return Promise.resolve(res);});
        console.log("Teams received")

       /* //Temporary, fill this with the result value that you want to send to 
        for (let i = 0; i < res.value.length; i++){
            console.log(res.value[i].displayName);

        }
        return res;*/
    }
    async listChannel(groupID:string){
        let client = MicrosoftGraph.Client.init({
            defaultVersion: "v1.0",
            debugLogging: true,
            authProvider: (done) => {
                done(null, secrets.accessToken);
            },
        });
        let request = '/teams/' + groupID+ '/channels';
            let res = await client.api(request)
            .get();
    
            //Temporary, fill this with the result value that you want to send to 
            for (let i = 0; i < res.value.length; i++){
                console.log(res.value[i].displayName);
                console.log(res.value[i].userId);

    
            }
            return res;
      
    }

}

export class Team extends vscode.TreeItem{
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly teamid: string, 
        public readonly isChild: boolean,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
    ){
        super(label, collapsibleState);
    }

    get tooltip(): string {
		return `${this.label}-${this.id}`;
	}

	get description(): string {
		return this.id;
    }
    iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
    contextValue = 'dependency';


}