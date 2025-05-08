class BalldontlieAPI {
  constructor(apiKey) {
    this.baseUrl = 'https://api.balldontlie.io/v1';
    this.apiKey = apiKey;
  }

  async getPlayers(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(`${key}[]`, v));
      } else {
        query.append(key, value);
      }
    });

    const url = `${this.baseUrl}/players?${query.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch players: ${res.status}`);
      return { data: [] };
    }

    return await res.json();
  }

  async getStats(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(`${key}[]`, v));
      } else {
        query.append(key, value);
      }
    });

    const url = `${this.baseUrl}/stats?${query.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    return await res.json();
  }

  async getSeasonAverages(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(`${key}[]`, v));
      } else {
        query.append(key, value);
      }
    });

    const url = `${this.baseUrl}/season_averages?${query.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch season averages: ${res.status}`);
      return { data: [] };
    }

    return await res.json();
  }

  async getTeams() {
    const url = `${this.baseUrl}/teams`;
    const res = await fetch(url);
    return await res.json();
  }
}

const api = {
  nba: new BalldontlieAPI('c81d57c3-85f8-40f2-ad5b-0c268c0220a0'),
};

export default api;
