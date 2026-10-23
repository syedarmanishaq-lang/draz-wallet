import { useState } from 'react';
import { db } from '../lib/supabase';

const fmt = (d) => new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });

export default function Account({ go }) {
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (!phone.trim()) return setStatus({ type: 'err', msg: 'Enter your phone number.' });
    setBusy(true);
    try {
      const u = await db.getUserByPhone(phone.trim());
      if (!u) {
        setStatus({ type: 'err', msg: 'No account found for this phone number. Make a deposit first.' });
        return;
      }
      const [deps, wds] = await Promise.all([
        db.listUserDeposits(u.id),
        db.listUserWithdrawals(u.id),
      ]);
      setUser(u);
      setDeposits(deps);
      setWithdrawals(wds);
    } catch (err) {
      setStatus({ type: 'err', msg: 'Could not load account. (' + err.message.slice(0, 80) + ')' });
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    setUser(null); setDeposits([]); setWithdrawals([]); setPhone('');
  };

  if (!user) {
    return (
      <div>
        <div className="dw-page-head">
          <h1>My Account</h1>
          <p>Enter the phone number you used for deposits to see your balance and history.</p>
        </div>
        <div className="dw-card dw-form">
          <h2>Log in</h2>
          <div className="sub">No password needed — your phone number is your account.</div>
          {status && <div className={`dw-alert ${status.type}`}>{status.msg}</div>}
          <form onSubmit={login}>
            <div className="field">
              <label>Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" inputMode="tel" />
            </div>
            <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Loading…' : 'View my account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const bal = parseFloat(user.balance_usd || 0);

  return (
    <div>
      <div className="dw-balance">
        <div className="label">{user.name} • {user.phone}</div>
        <div className="value">${bal.toFixed(2)} <small>USD</small></div>
        <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-gold btn-sm" onClick={() => go('deposit')}>Deposit</button>
          <button className="btn btn-ghost btn-sm" onClick={() => go('withdraw')}>Withdraw</button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="dw-section-title">Deposits <span className="count">{deposits.length}</span></div>
      {deposits.length === 0 && <div className="dw-empty">No deposits yet.</div>}
      {deposits.map((d) => (
        <div className="dw-row" key={d.id}>
          <div className="meta">
            <b>${parseFloat(d.amount_usd).toFixed(2)}</b>
            <span>TXID: {d.txid}</span>
            <span>{fmt(d.created_at)}</span>
            <span className={`badge ${d.status}`}>{d.status}</span>
          </div>
        </div>
      ))}

      <div className="dw-section-title">Withdrawals <span className="count">{withdrawals.length}</span></div>
      {withdrawals.length === 0 && <div className="dw-empty">No withdrawals yet.</div>}
      {withdrawals.map((w) => (
        <div className="dw-row" key={w.id}>
          <div className="meta">
            <b>${parseFloat(w.amount_usd).toFixed(2)}</b>
            <span>To: {w.binance_id}</span>
            <span>{fmt(w.created_at)}</span>
            <span className={`badge ${w.status}`}>{w.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
