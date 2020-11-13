import {AuthStatus, BeEvent, BentleyError, ClientRequestContext} from '@bentley/bentleyjs-core';
import {AccessToken} from '@bentley/itwin-client';
import {FrontendAuthorizationClient} from '@bentley/frontend-authorization-client';

export class NoSignInIAuthClient implements FrontendAuthorizationClient {
    public readonly onUserStateChanged: BeEvent<(token: AccessToken | undefined) => void>;
    protected _accessToken?: AccessToken;

    constructor() {
        this.onUserStateChanged = new BeEvent();
    }

    public async signIn(requestContext?: ClientRequestContext): Promise<void> {
        if (requestContext) {
            requestContext.enter();
        }
        await this.getAccessToken();
    }
    public async signOut(requestContext?: ClientRequestContext): Promise<void> {
        if (requestContext) {
            requestContext.enter();
        }
        this._accessToken = undefined;
    }

    public get isAuthorized(): boolean {
        return this.hasSignedIn;
    }

    public get hasExpired(): boolean {
        return !this._accessToken;
    }

    public get hasSignedIn(): boolean {
        return !!this._accessToken;
    }

    public async generateTokenString(requestContext?: ClientRequestContext) {
        if (requestContext) {
            requestContext.enter();
        }

        const response = await fetch('https://lehighmap.csb.lehigh.edu:5000/api/token');
        const {token} = await response.json();
        token._userInfo = { id: "MockId" };
        const accessToken = AccessToken.fromJson(token);
        console.log(token);
        this._accessToken = accessToken;

        setTimeout(() => {
            this.generateTokenString().catch(error => {
                throw new BentleyError(AuthStatus.Error, error);
            });
        }, 1000 * 60 * 55);
    }

    public async getAccessToken(): Promise<AccessToken> {
        if (!this._accessToken) throw new BentleyError(AuthStatus.Error, 'Cannot get access token');

        return this._accessToken;
    }
}
