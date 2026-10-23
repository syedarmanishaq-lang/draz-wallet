import { useState, useEffect } from 'react';
import { db } from '../lib/supabase';

const ADMIN_PASSWORD = 'DrazWallet2026!';
const fmt = (d) => new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('deposits');
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  const load = async () => {
    setBusy(true);
    try {
      const [deps, wds, us] = await Promise.all([
        db.listDeposits(),
        db.listWithdrawals(),
        db.listUsers(),
      ]);
      setDeposits(deps);
      setWithdrawals(wds);
      setUsers(us);
    } catch (e) {
      setNote({ type: 'err', msg: 'Load failed: ' + e.message.slice(0, 100) });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const auth = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) setAuthed(true);
    else setNote({ type: 'err', msg: 'Wrong password.' });
  };

  const decideDeposit = async (d, verdict) => {
    if (!confirm(`${verdict === 'approved' ? 'APPROVE' : 'REJECT'} deposit of $${d.amount_usd} from ${d.wallet_users?.name}?`)) return;
    setBusy(true);
    try {
      await db.decideDeposit(d.id, verdict);
      if (verdict === 'approved') {
        const u = users.find((x) => x.id === d.user_id);
        const newBal = parseFloat(u?.balance_usd || 0) + parseFloat(d.amount_usd);
        await db.setBalance(d.user_id, newBal);
      }
      setNote({ type: 'ok', msg: `Deposit ${verdict}.` });
      await load();
    } catch (e) {
      setNote({ type: 'err', msg: e.message.slice(0, 100) });
    } finally {
      setBusy(false);
    }
  };

  const decideWithdrawal = async (w, verdict) => {
    if (!confirm(`${verdict === 'approved' ? 'APPROVE' : 'REJECT'} withdrawal of $${w.amount_usd} to ${w.binance_id}?${verdict === 'approved' ? '\n\nMake sure you already sent the BNB on Binance!' : ''}`)) return;
    setBusy(true);
    try {
      await db.decideWithdrawal(w.id, verdict);
      if (verdict === 'approved') {
        const u = users.find((x) => x.id === w.user_id);
        const newBal = parseFloat(u?.balance_usd || 0) - parseFloat(w.amount_usd);
        await db.setBalance(w.user_id, Math.max(0, newBal));
      }
      setNote({ type: 'ok', msg: `Withdrawal ${verdict}.` });
      await load();
    } catch (e) {
      setNote({ type: 'err', msg: e.message.slice(0, 100) });
    } finally {
      setBusy(false);
    }
  };

  if (!authed) {
    return (
      <div>
        <div className="dw-page-head"><h1>Admin Panel</h1><p>Restricted area.</p></div>
        <div className="dw-card dw-form">
          <h2>Sign in</h2>
          {note && <div className={`dw-alert ${note.type}`}>{note.msg}</div>}
          <form onSubmit={auth}>
            <div className="field">
              <label>Admin password</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-gold" style={{ width: '100%' }}>Enter</button>
          </form>
        </div>
      </div>
    );
  }

  const pendDeps = deposits.filter((d) => d.status === 'pending');
  const pendWds = withdrawals.filter((w) => w.status === 'pending');

  return (
    <div>
      <div className="dw-page-head">
        <h1>Admin Panel</h1>
        <p>Approve deposits, process withdrawals, manage balances.</p>
      </div>

      {note && <div className={`dw-alert ${note.type}`} style={{ maxWidth: 720, margin: '0 auto 20px' }}>{note.msg}</div>}

      <div className="dw-tabs" style={{ justifyContent: 'center' }}>
        <button className={tab === 'deposits' ? 'active' : ''} onClick={() => setTab('deposits')}>
          Deposits {pendDeps.length > 0 && `(${pendDeps.length} pending)`}
        </button>
        <button className={tab === 'withdrawals' ? 'active' : ''} onClick={() => setTab('withdrawals')}>
          Withdrawals {pendWds.length > 0 && `(${pendWds.length} pending)`}
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          Users ({users.length})
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {busy && <div className="dw-empty">Loading…</div>}

        {tab === 'deposits' && !busy && (
          <>
            <div className="dw-section-title">Pending deposits <span className="count">{pendDeps.length}</span></div>
            {pendDeps.length === 0 && <div className="dw-empty">No pending deposits. 🎉</div>}
            {pendDeps.map((d) => (
              <div className="dw-row" key={d.id}>
                <div className="meta">
                  <b>{d.wallet_users?.name} <span style={{ color: '#8b94a9', fontWeight: 400 }}>({d.wallet_users?.phone})</span></b>
                  <span>TXID: {d.txid}</span>
                  <span>{fmt(d.created_at)}</span>
                </div>
                <div className="amt">${parseFloat(d.amount_usd).toFixed(2)}</div>
                <div className="dw-actions">
                  <button className="btn btn-green btn-sm" onClick={() => decideDeposit(d, 'approved')}>Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => decideDeposit(d, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'withdrawals' && !busy && (
          <>
            <div className="dw-section-title">Pending withdrawals <span className="count">{pendWds.length}</span></div>
            {pendWds.length === 0 && <div className="dw-empty">No pending withdrawals. 🎉</div>}
            {pendWds.map((w) => (
              <div className="dw-row" key={w.id}>
                <div className="meta">
                  <b>{w.wallet_users?.name} <span style={{ color: '#8b94a9', fontWeight: 400 }}>({w.wallet_users?.phone})</span></b>
                  <span>Send to Binance ID: {w.binance_id}</span>
                  <span>{fmt(w.created_at)}</span>
                </div>
                <div className="amt">${parseFloat(w.amount_usd).toFixed(2)}</div>
                <div className="dw-actions">
                  <button className="btn btn-green btn-sm" onClick={() => decideWithdrawal(w, 'approved')}>Approve &amp; sent</button>
                  <button className="btn btn-danger btn-sm" onClick={() => decideWithdrawal(w, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'users' && !busy && (
          <>
            <div className="dw-section-title">All users <span className="count">{users.length}</span></div>
            {users.length === 0 && <div className="dw-empty">No users yet.</div>}
            {users.map((u) => (
              <div className="dw-row" key={u.id}>
                <div className="meta">
                  <b>{u.name}</b>
                  <span>{u.phone}{u.binance_id ? ` • ${u.binance_id}` : ''}</span>
                  <span>Joined {fmt(u.created_at)}</span>
                </div>
                <div className="amt" style={{ color: '#f0b90b' }}>${parseFloat(u.balance_usd || 0).toFixed(2)}</div>
              </div>
            ))}
          </>
        )}

        {tab === 'history' && !busy && (
          <>
            <div className="dw-section-title">Deposit history</div>
            {deposits.filter((d) => d.status !== 'pending').slice(0, 20).map((d) => (
              <div className="dw-row" key={d.id}>
                <div className="meta">
                  <b>{d.wallet_users?.name} — ${parseFloat(d.amount_usd).toFixed(2)}</b>
                  <span>{fmt(d.created_at)}</span>
                  <span className={`badge ${d.status}`}>{d.status}</span>
                </div>
              </div>
            ))}
            <div className="dw-section-title">Withdrawal history</div>
            {withdrawals.filter((w) => w.status !== 'pending').slice(0, 20).map((w) => (
              <div className="dw-row" key={w.id}>
                <div className="meta">
                  <b>{w.wallet_users?.name} — ${parseFloat(w.amount_usd).toFixed(2)}</b>
                  <span>{fmt(w.created_at)}</span>
                  <span className={`badge ${w.status}`}>{w.status}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
