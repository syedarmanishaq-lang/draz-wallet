import { useState } from 'react';
import { db } from '../lib/supabase';

export default function Withdraw({ go }) {
  const [form, setForm] = useState({ name: '', phone: '', amount: '', binanceId: '' });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || !form.phone.trim() || !form.binanceId.trim()) {
      return setStatus({ type: 'err', msg: 'Please fill in name, phone and your Binance ID.' });
    }
    if (!amount || amount <= 0) {
      return setStatus({ type: 'err', msg: 'Please enter a valid amount in USD.' });
    }
    setBusy(true);
    try {
      const user = await db.upsertUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        binance_id: form.binanceId.trim(),
      });
      const balance = parseFloat(user.balance_usd || 0);
      if (amount > balance) {
        setStatus({ type: 'err', msg: `Insufficient balance. Your current balance is $${balance.toFixed(2)}.` });
        return;
      }
      await db.createWithdrawal({
        user_id: user.id,
        amount_usd: amount,
        binance_id: form.binanceId.trim(),
      });
      setStatus({ type: 'ok', msg: `Withdrawal of $${amount.toFixed(2)} submitted — status: PENDING. The admin will send BNB to your Binance ID and approve the request.` });
      setForm({ name: form.name, phone: form.phone, amount: '', binanceId: form.binanceId });
    } catch (err) {
      setStatus({ type: 'err', msg: 'Something went wrong. Please try again. (' + err.message.slice(0, 80) + ')' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="dw-page-head">
        <h1>Withdraw</h1>
        <p>Request a withdrawal — the admin sends BNB to your Binance address and approves it.</p>
      </div>

      <div className="dw-card dw-form">
        <h2>Request withdrawal</h2>
        <div className="sub">Your request stays <b>pending</b> until the admin sends the payment and approves it.</div>
        {status && <div className={`dw-alert ${status.type}`}>{status.msg}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Your name</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Ahmed Khan" />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input value={form.phone} onChange={set('phone')} placeholder="03xx-xxxxxxx" inputMode="tel" />
            <div className="hint">Must match the phone number you used for deposits.</div>
          </div>
          <div className="field">
            <label>Amount (USD)</label>
            <input value={form.amount} onChange={set('amount')} placeholder="50" inputMode="decimal" />
          </div>
          <div className="field">
            <label>Your Binance ID / BNB address</label>
            <input value={form.binanceId} onChange={set('binanceId')} placeholder="Your Binance UID or BEP20 address" />
            <div className="hint">Double-check this — the admin sends your BNB here.</div>
          </div>
          <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit withdrawal'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => go('account')}>Check my balance</button>
        </div>
      </div>
    </div>
  );
}
