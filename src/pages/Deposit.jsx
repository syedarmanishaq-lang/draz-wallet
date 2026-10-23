import { useState } from 'react';
import { db } from '../lib/supabase';
import { DEPOSIT_ADDRESS } from './Home';

export default function Deposit({ go }) {
  const [form, setForm] = useState({ name: '', phone: '', amount: '', txid: '' });
  const [status, setStatus] = useState(null); // {type, msg}
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || !form.phone.trim() || !form.txid.trim()) {
      return setStatus({ type: 'err', msg: 'Please fill in name, phone and transaction ID.' });
    }
    if (!amount || amount <= 0) {
      return setStatus({ type: 'err', msg: 'Please enter a valid amount in USD.' });
    }
    setBusy(true);
    try {
      const user = await db.upsertUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        binance_id: '',
      });
      await db.createDeposit({
        user_id: user.id,
        amount_usd: amount,
        txid: form.txid.trim(),
      });
      setStatus({ type: 'ok', msg: `Deposit of $${amount.toFixed(2)} submitted — status: PENDING approval. We will credit your wallet after verifying the transaction on Binance.` });
      setForm({ name: form.name, phone: form.phone, amount: '', txid: '' });
    } catch (err) {
      setStatus({ type: 'err', msg: 'Something went wrong. Please try again. (' + err.message.slice(0, 80) + ')' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="dw-page-head">
        <h1>Deposit</h1>
        <p>Send BNB via Binance to the address below, then submit your transaction ID here.</p>
      </div>

      <div className="dw-address-box" style={{ marginBottom: 28 }}>
        <div className="label">Send BNB (BEP20) to</div>
        <div className="addr">{DEPOSIT_ADDRESS}</div>
      </div>

      <div className="dw-card dw-form">
        <h2>Submit deposit</h2>
        <div className="sub">Your request stays <b>pending</b> until the admin verifies and approves it.</div>
        {status && <div className={`dw-alert ${status.type}`}>{status.msg}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Your name</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Ahmed Khan" />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input value={form.phone} onChange={set('phone')} placeholder="03xx-xxxxxxx" inputMode="tel" />
            <div className="hint">Use the same phone number every time — it is your account login.</div>
          </div>
          <div className="field">
            <label>Amount (USD)</label>
            <input value={form.amount} onChange={set('amount')} placeholder="50" inputMode="decimal" />
          </div>
          <div className="field">
            <label>Binance transaction ID (TXID)</label>
            <input value={form.txid} onChange={set('txid')} placeholder="Paste the TX hash from Binance" />
            <div className="hint">Find it in Binance → Wallet → Transaction history → tap the transaction → copy the TXID.</div>
          </div>
          <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit deposit'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => go('account')}>Check my balance</button>
        </div>
      </div>
    </div>
  );
}
