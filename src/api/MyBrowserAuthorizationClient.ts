import {User, UserManager, UserManagerSettings} from 'oidc-client';
import {assert, AuthStatus, BeEvent, BentleyError, ClientRequestContext, IDisposable, Logger} from '@bentley/bentleyjs-core';
import {AccessToken, ImsAuthorizationClient} from '@bentley/itwin-client';
import {BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient, BrowserAuthorizationClientConfiguration} from '@bentley/frontend-authorization-client';

export class MyBrowserAuthorizationClient extends BrowserAuthorizationClient {
    public setAccessToken(accessToken: AccessToken) {
        this._accessToken = accessToken;
    }
}
