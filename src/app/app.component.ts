import { Component } from '@angular/core';
import { KalturaClient, KalturaClientOptions } from 'kaltura-typescript-client';
import { KalturaFilterPager, KalturaSessionType, KalturaUserRoleFilter, SessionStartAction, SessionStartActionArgs, UserRoleListAction } from 'kaltura-typescript-client/api/types';
const config = {
  "serviceUrl": "https://cdnapisec.kaltura.com",
  "apiSecret": "Admin Secret goes here", // admin secret
  "partnerId": 'Partner Id goes here', // partnerId
  "userId": 'User Id goes here', // username
  "userDisplayName": "anyUserName", // userDisplayName
  "sessionDuration": 86400,
  "entryId": "entrId goes here", // entryId
  "referenceId": "unique_custom_id", // 
  "uiConfId": 'uiConfId goes here' // uiConfiId
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'unext-kaltura-editor-app-embed';
  editorUrl = '';
  client!: KalturaClient;
  async ngOnInit() {
    // get the sanitized config params:  
    const kalturaClient: KalturaClientOptions = {
      clientTag: "sample-code",
      endpointUrl: `http://www.kaltura.com/`,
    };
    const client = new KalturaClient(kalturaClient);
    this.client = client;
    const apiSecret = config.apiSecret;
    const partnerId = config.partnerId;
    const expiry = config.sessionDuration;
    const entryId = config.entryId;
    const referenceId = config.referenceId; //3rd party system ID to match with the new clip that will be created
    const userId = config.userId;
    const uiConfId = config.uiConfId as any;
    const userDisplayName = config.userDisplayName;

    this.createSession().then((result: any) => {

      this.client?.setDefaultRequestOptions({ ks: result });
      // use the ADMIN KS to retrieve the ID of the editor app special user role (in order to update the referenceId field):
      this.renderEditorApp(config, client, config.serviceUrl, entryId, referenceId, uiConfId, userDisplayName, apiSecret, userId, partnerId, expiry);
    });
  }

  renderEditorApp(res: any, client: any, serviceUrl: any, entryId: any, referenceId: string, uiConfId: number, userDisplayName: string, apiSecret: string, userId: string, partnerId: number, expiry: number) {
    const privileges = "*";
    // Get a USER Kaltura Session -
    this.createSession(privileges)
      .then((result: any) => {
        this.client.setDefaultRequestOptions({ ks: result });
        // Render the editor iframe
        let editorUrl = "//cdnapisec.kaltura.com/apps/kea/latest/index.html";
        this.loadEditor({
          editorUrl: editorUrl,
          partnerId: partnerId,
          ks: result,
          entryId: entryId,
          referenceId: referenceId,
          uiConfId: uiConfId,
          userDisplayName: userDisplayName,
          serviceUrl: serviceUrl
        });
      });
  }

  loadEditor({
    editorUrl,
    partnerId,
    ks,
    entryId,
    referenceId,
    uiConfId,
    userDisplayName,
    serviceUrl
  }: any) {
    this.editorUrl = editorUrl;

    var keaInitParams = getInitParams(serviceUrl, partnerId, ks, entryId, uiConfId, userDisplayName);

    function getInitParams(serviceUrl: string, partnerId: number, ks: string, entryId: string, uiConfId: number, userDisplayName: string) {
      return {
        'messageType': 'kea-config',
        'data': {
          'service_url': serviceUrl,
          'partner_id': partnerId,
          'entry_id': entryId,
          'ks': ks,
          'preview_ks': ks,
          'player_uiconf_id': uiConfId,
          'preview_player_uiconf_id': uiConfId,
          'load_thumbnail_with_ks': true,
          'user_dispaly_name': userDisplayName,
          'language_code': 'en',
          'locale_url': '//' + window.location.host + '/assets/i18n/kaltura-video-editor_en.json',
          'help_link': 'https://knowledge.kaltura.com/node/1912',
          'tab': 'editor',
          'tabs': {
            'edit': {
              name: 'Video',
              permissions: ['clip', 'trim'],
              userPermissions: ['clip', 'trim'],
              showOnlyExpandedView: false,
              showSaveButton: true,
              showSaveAsButton: false
            },
            'quiz': {
              name: 'Quiz',
              permissions: ['quiz', 'questions-v2', 'questions-v3', "enable-retake", "preventSeek"],
              userPermissions: ['quiz']
            },
            'hotspots': {
              name: 'Hotspot',
              showSaveButton: true
            }
          },
          'css_url': '//' + window.location.host + '/assets/css/editor.css',
          'hide_navigation_bar': false,
          'hide_quiz_goto_media_button': true,
          'skip_quiz_start_page': false
        }
      }
    }

    // Initialize the kaltura editor app communication: 
    var initParamsListener = window.addEventListener('message', function (e: any) {

      // validate postMessage recieved -
      var postMessageData;
      try {
        postMessageData = e.data;
      } catch (ex) {
        return;
      }

      /* This is the initialization request for init params,
      * should return a message where messageType = kea-config along with the initialization params (see above) */
      if (postMessageData.messageType === 'kea-bootstrap') {
        e.source.postMessage(keaInitParams, e.origin);
      }

      // attach to the external Save button click:
      // saveBtn.addEventListener('click', function () {
      //   // execute the Save command:
      //   e.source.postMessage({ messageType: 'kea-do-save' }, e.origin);
      // });

      // // attach to the external Save As button click:
      // saveAsBtn.addEventListener('click', function () {
      //   // execute the Save As command:
      //   // i.e. Start the clipping process (will prompt user)
      //   // And pass optional reference id param to keep reference to the external hosting app entry id.
      //   //    useful for cases where the hosting app was closed while clipping.
      //   e.source.postMessage({
      //     messageType: 'kea-do-save-as',
      //     data: { referenceId: referenceId }
      //   }, e.origin);
      // });

      /* The video editing tab was loaded (clip/trim functionality)
      * enable the save and save as buttons:
      */
      if (postMessageData.messageType === 'kea-editor-tab-loaded') {
        // saveAsBtn.removeAttribute('disabled');
        // saveBtn.removeAttribute('disabled');
      }

      // the quiz tab was enabled - disable the external buttons:
      if (postMessageData.messageType === 'kea-quiz-tab-loaded') {
        // saveAsBtn.setAttribute('disabled', true);
        // saveBtn.setAttribute('disabled', true);
      }

      // the ads or hotspos tabs were enabled, enable only external save button (no save as option):
      if (postMessageData.messageType === 'kea-advertisements-tab-loaded' ||
        postMessageData.messageType === 'kea-hotspots-tab-loaded') {
        // saveAsBtn.setAttribute('disabled', true);
        // saveBtn.removeAttribute('disabled');
      }

      /* received when a trim action was requested.
      * message.data = {entryId}
      * should return a message where message.messageType = kea-trim-message
      * and message.data is the (localized) text to show the user.
      */
      if (postMessageData.messageType === 'kea-trimming-started') {
        e.source.postMessage({
          messageType: 'kea-trim-message',
          data: 'You must approve the media replacement in order to be able to watch the trimmed media'
        }, e.origin)
      }

      /* received when a trim action is complete.
      * message.data = {entryId}
      * can be used to clear app cache, for example.
      */
      if (postMessageData.messageType === 'kea-trimming-done') {
        // console.log('processing of entry with id ' + message.data.entryId + ' is complete');
      }

      /* received when a clip was created.
      * postMessageData.data: {
      *  originalEntryId,
      *  newEntryId,
      *  newEntryName
      * }
      * should return a message where message.messageType = kea-clip-message,
      * and message.data is the (localized) text to show the user.
      * */
      if (postMessageData.messageType === 'kea-clip-created') {
        // send a message to editor app which will show up after clip has been created:
        var message = 'Thank you for creating a new clip, the new entry ID is: ' + postMessageData.data.newEntryId;
        e.source.postMessage({
          'messageType': 'kea-clip-message',
          'data': message
        }, e.origin);
      }

      /* request for a KS to pass to the preview player
      * message.data = entryId
      * may return {
      *   messageType: kea-preview-ks
      *   data: ks
      * }
      * don't include user name or add sview privilege, for example.
      * if not provided, the main KS will be used */
      if (postMessageData.messageType === 'kea-get-preview-ks') {
        e.source.postMessage({
          messageType: 'kea-preview-ks',
          data: ks
        }, e.origin);
      }

      /* request for a KS. required for entitlements and access control when "switching" entries
        (currently when creating a new quiz only).
      * message.data = entryId
      * may return {
      *   messageType: kea-ks
      *   data: ks
      * }
      * if not provided, the main KS will be used */
      if (postMessageData.messageType === 'kea-get-ks') {
        e.source.postMessage({
          messageType: 'kea-ks',
          data: ks
        }, e.origin)
      }

      /* request for user display name.
      * message.data = {userId}
      * the hosting app can get the userId from: postMessageData.data.userId and then return corresponding display name
      * should return a message {messageType:kea-display-name, data: display name}
      */
      if (postMessageData.messageType === 'kea-get-display-name') {
        // in this sample we've simplified and used the config file to set the display name.
        var displayName = userDisplayName;
        e.source.postMessage({
          'messageType': 'kea-display-name',
          'data': displayName
        }, e.origin);
      }

      /*
      * Fired when saving quiz's settings.
      * message.data = {entryId}
      */
      if (postMessageData.messageType === 'kea-quiz-updated') {
        // do whatever, you can invalidate cache, etc..
      }

      /*
      * Fired when creating a new quiz
      * message.data = {entryId}
      */
      if (postMessageData.messageType === 'kea-quiz-created') {
        // do whatever, you can invalidate cache, etc..
      }

      /*
      * Fired when modifying advertisements (save not performed yet).
      * message.data = {entryId}
      */
      if (postMessageData.messageType === 'kea-advertisements-modified') {
        // do whatever, you can invalidate cache, etc..
      }

      /*
      * Fired when saving advertisements
      * message.data = {entryId}
      */
      if (postMessageData.messageType === 'kea-advertisements-saved') {
        // do whatever, you can invalidate cache, etc..
      }

      /* received when user clicks the "go to media" button after quiz was created/edited
      * message.data = entryId
      * host should navigate to a page displaying the relevant media */
      if (postMessageData.messageType === 'kea-go-to-media') {
        console.log("Hosting app should redirect to: " + postMessageData.data);
      }

    });
  }

  private async getConfig() {
    const config = {
      clientTag: "sample-code",
      endpointUrl: 'https://www.kaltura.com',
    };
    return config;
  }

  private async getClientInstance(): Promise<KalturaClient> {
    const config = await this.getConfig();
    return new KalturaClient(config);
  }


  async createSession(inputPrivileges?: string, startSessionParams?: Partial<SessionStartActionArgs>) {
    const client = await this.getClientInstance();
    const secret = config.apiSecret;
    const userId = config.userId;
    const expiry = 86400;
    const type = KalturaSessionType.admin;
    const startSessionArgs: SessionStartActionArgs = {
      userId,
      secret,
      type,
      partnerId: config.partnerId,
      privileges: inputPrivileges ? inputPrivileges : '*', // might need to check this
      expiry,
    };
    if (startSessionParams?.userId) {
      startSessionArgs.userId = startSessionParams.userId;
    }
    if (startSessionParams?.secret) {
      startSessionArgs.secret = startSessionParams.secret;
    }
    if (startSessionParams?.type) {
      startSessionArgs.type = startSessionParams.type;
    }
    const startSessionRequest = new SessionStartAction(startSessionArgs);
    const ksToken = await client.request(startSessionRequest);
    return ksToken;
  }

}
