import { EventEmitter, Injectable } from '@angular/core';

import { web } from '../private/service_accounts/google-drive-picker-client.json';
import { environment } from '../private/enviroments/enviroment';
import { NameId } from '../interfaces/Other';

type Folder = NameId;

@Injectable({
	providedIn: 'root',
})
export class DriveService {
	private tokenClient: google.accounts.oauth2.TokenClient;
	private accessToken: string = '';
	private pickerInited: boolean = false;

	public folderSelected: EventEmitter<Folder[]> = new EventEmitter<Folder[]>();

	constructor() {
		// Initialize Google API
		gapi.load('picker', this.onPickerApiLoad.bind(this));

		// Initialize Google Identity Services
		this.tokenClient = google.accounts.oauth2.initTokenClient({
			client_id: web.client_id,
			scope: 'https://www.googleapis.com/auth/drive.readonly',
			callback: (response: google.accounts.oauth2.TokenResponse) => {
				if (response.error !== undefined) throw response;

				this.accessToken = response.access_token;
				this.createPicker();
			},
		});
	}

	// Drive Picker
	public onPickerApiLoad(): void {
		this.pickerInited = true;
	}

	// Create and render a Google Picker object for selecting from Drive.
	protected createPicker(): void {
		const folderView: google.picker.DocsView = new google.picker.DocsView(
			google.picker.ViewId.FOLDERS,
		)
			.setStarred(false)
			.setIncludeFolders(true)
			.setSelectFolderEnabled(true)
			.setMimeTypes('application/vnd.google-apps.folder');

		const picker: google.picker.Picker = new google.picker.PickerBuilder()
			.setTitle('Select one or more folders')
			.addView(folderView)
			.setSelectableMimeTypes('application/vnd.google-apps.folder')
			.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
			.setOAuthToken(this.accessToken)
			.setDeveloperKey(environment.drivePickerApiKey)
			.setCallback((data) => this.pickerCallback(data))
			.setAppId(environment.googleProjectConfig.projectNumber)
			.build();

		if (this.accessToken) {
			// Show picker directly if we have a token
			picker.setVisible(true);
		} else {
			// Prompt the user to select a Google Account and ask for consent to share their data
			this.tokenClient.requestAccessToken({ prompt: 'consent' });
		}
	}

	public showPicker(): void {
		if (this.pickerInited) {
			this.createPicker();
		} else {
			gapi.load('picker', () => {
				this.onPickerApiLoad();
				this.createPicker();
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
}
