import { EventEmitter, Injectable } from '@angular/core';

import { environment } from '../private/enviroments/enviroment';
import { NameId } from '../interfaces/Other';
import { ACTION } from '../interfaces/Macro';
import { AuthService } from './auth.service';
import { Tokens } from '../interfaces/Tokens';

type Folder = NameId;

@Injectable({
	providedIn: 'root',
})
export class DriveService {
	// private tokenClient: google.accounts.oauth2.TokenClient;
	private accessToken: string = '';
	private pickerInited: boolean = false;

	public folderSelected: EventEmitter<Folder[]> = new EventEmitter<Folder[]>();
	private currentAction: ACTION = ACTION.Attachment;

	constructor(private authService: AuthService) {
		// Initialize Google API
		gapi.load('picker', this.onPickerApiLoad.bind(this));
	}

	// Drive Picker
	public onPickerApiLoad(): void {
		this.pickerInited = true;
	}

	// Create and render a Google Picker object for selecting from Drive.
	protected async createPicker(actionType: ACTION): Promise<void> {
		this.currentAction = actionType;
		const picker = this.getPicker(actionType);

		if (this.accessToken) {
			// Show picker directly if we have a token
			picker.setVisible(true);
		} else {
			// Prompt the user to select a Google Account and ask for consent to share their data
			try {
				const tokens = await this.requestDrivePermissions();

				this.authService.setTokens(tokens);
				this.accessToken = tokens.access_token;

				await this.createPicker(this.currentAction);
			} catch (error) {
				console.error('Error requesting drive permissions:', error);
				return;
			}
		}
	}

	private getPicker(actionType: ACTION): google.picker.Picker {
		let folderView: google.picker.DocsView;

		switch (actionType) {
			case ACTION.Attachment:
				folderView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
					.setStarred(false)
					.setIncludeFolders(true)
					.setSelectFolderEnabled(true)
					.setMimeTypes('application/vnd.google-apps.folder');

				return new google.picker.PickerBuilder()
					.setTitle('Select one or more folders')
					.addView(folderView)
					.setSelectableMimeTypes('application/vnd.google-apps.folder')
					.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
					.setOAuthToken(this.accessToken)
					.setDeveloperKey(environment.drivePickerApiKey)
					.setCallback((data) => this.pickerCallback(data))
					.setAppId(environment.googleProjectConfig.projectNumber)
					.build();

			default:
				folderView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
					.setStarred(false)
					.setIncludeFolders(true)
					.setSelectFolderEnabled(true)
					.setMimeTypes('application/vnd.google-apps.folder');

				return new google.picker.PickerBuilder()
					.setTitle('Select one or more folders')
					.addView(folderView)
					.setSelectableMimeTypes('application/vnd.google-apps.folder')
					.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
					.setOAuthToken(this.accessToken)
					.setDeveloperKey(environment.drivePickerApiKey)
					.setCallback((data) => this.pickerCallback(data))
					.setAppId(environment.googleProjectConfig.projectNumber)
					.build();
		}
	}

	public showPicker(actionType: ACTION): void {
		if (this.pickerInited) {
			this.createPicker(actionType);
		} else {
			gapi.load('picker', () => {
				this.onPickerApiLoad();
				this.createPicker(actionType);
			});
		}
	}

	protected pickerCallback(data: google.picker.ResponseObject): void {
		if (data[google.picker.Response.ACTION] !== google.picker.Action.PICKED) return;

		const documents: google.picker.DocumentObject[] =
			data[google.picker.Response.DOCUMENTS] || [];

		if (documents.length <= 0) return;

		const folders = documents.map((doc) => ({
			name: doc[google.picker.Document.NAME] || '',
			id: doc[google.picker.Document.ID],
		}));
		this.folderSelected.emit(folders);
	}

	protected async requestDrivePermissions(): Promise<Tokens> {
		return new Promise<Tokens>(async (resolve, reject) => {
			try {
				const code = await this.authService.incrementDrivePermissions();
				const { tokens } = await this.authService.exchangeCodeForTokens(code);

				resolve(tokens);
			} catch (error) {
				console.error('Error requesting drive permissions:', error);
				reject(error);
			}
		});
	}
}
