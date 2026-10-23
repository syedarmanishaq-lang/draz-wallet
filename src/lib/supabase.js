// Minimal Supabase REST client (no extra dependency needed)
export const SUPABASE_URL = 'https://vhmqofxciisnrxrzbovq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobXFvZnhjaWlzbnJ4cnpib3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTg5NjksImV4cCI6MjEwODE3NDk2OX0.gLm7UZmhrQ3dWS4id-jrjni9OFnBc3QshqlObB1w-2I';

async function req(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const db = {
  // ---- users ----
  async getUserByPhone(phone) {
    const rows = await req(`wallet_users?phone=eq.${encodeURIComponent(phone)}&select=*`);
    return rows[0] || null;
  },
  async createUser({ name, phone, binance_id }) {
    const rows = await req('wallet_users', {
      method: 'POST',
      body: JSON.stringify({ name, phone, binance_id: binance_id || null }),
    });
    return rows[0];
  },
  async upsertUser({ name, phone, binance_id }) {
    const existing = await this.getUserByPhone(phone);
    if (existing) {
      const updates = {};
      if (name && name !== existing.name) updates.name = name;
      if (binance_id && binance_id !== existing.binance_id) updates.binance_id = binance_id;
      if (Object.keys(updates).length) {
        const rows = await req(`wallet_users?id=eq.${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        return rows[0];
      }
      return existing;
    }
    return this.createUser({ name, phone, binance_id });
  },
  async listUsers() {
    return req('wallet_users?select=*&order=created_at.desc');
  },
  async setBalance(userId, balance) {
    const rows = await req(`wallet_users?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ balance_usd: balance }),
    });
    return rows[0];
  },

  // ---- deposits ----
  async createDeposit({ user_id, amount_usd, txid }) {
    const rows = await req('wallet_deposits', {
      method: 'POST',
      body: JSON.stringify({ user_id, amount_usd, txid }),
    });
    return rows[0];
  },
  async listDeposits(status) {
    const q = status ? `&status=eq.${status}` : '';
    return req(`wallet_deposits?select=*,wallet_users(name,phone)${q}&order=created_at.desc`);
  },
  async listUserDeposits(userId) {
    return req(`wallet_deposits?user_id=eq.${userId}&select=*&order=created_at.desc`);
  },
  async decideDeposit(id, status) {
    const rows = await req(`wallet_deposits?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, decided_at: new Date().toISOString() }),
    });
    return rows[0];
  },

  // ---- withdrawals ----
  async createWithdrawal({ user_id, amount_usd, binance_id }) {
    const rows = await req('wallet_withdrawals', {
      method: 'POST',
      body: JSON.stringify({ user_id, amount_usd, binance_id }),
    });
    return rows[0];
  },
  async listWithdrawals(status) {
    const q = status ? `&status=eq.${status}` : '';
    return req(`wallet_withdrawals?select=*,wallet_users(name,phone)${q}&order=created_at.desc`);
  },
  async listUserWithdrawals(userId) {
    return req(`wallet_withdrawals?user_id=eq.${userId}&select=*&order=created_at.desc`);
  },
  async decideWithdrawal(id, status) {
    const rows = await req(`wallet_withdrawals?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, decided_at: new Date().toISOString() }),
    });
    return rows[0];
  },
};
