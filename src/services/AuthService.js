export class AuthService {
  constructor() { this.loggedIn = false; }

  async loginMock() {
    // TODO(Douyin SDK): replace this placeholder with tt.login / auth once the mini-game shell is integrated.
    this.loggedIn = true;
    return { ok: true, mock: true, provider: 'douyin', nickname: '小猫游客' };
  }
}
