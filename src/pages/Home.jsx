import { useState } from 'react';

// Admin's Binance deposit address — Luffy fills this in later from the admin panel note.
// Placeholder shown until he sets his real address.
export const DEPOSIT_ADDRESS = 'YOUR-BINANCE-BNB-ADDRESS-HERE';

export default function Home({ go }) {
  const [copied, setCopied] = useState(false);

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(DEPOSIT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div className="dw-hero">
        <div className="kicker">Daraz Customers • Binance (BNB) Payments</div>
        <h1>Draz <span className="gold">Wallet</span></h1>
        <p>
          Bought something on Daraz? Pay securely with Binance (BNB).
          Send your payment, submit the transaction ID, and once the admin
          approves it, your wallet balance is credited instantly.
        </p>
        <div className="dw-cta-row">
          <button className="btn btn-gold" onClick={() => go('deposit')}>Deposit Now</button>
          <button className="btn btn-ghost" onClick={() => go('withdraw')}>Withdraw</button>
          <button className="btn btn-ghost" onClick={() => go('account')}>My Account</button>
        </div>
      </div>

      <div className="dw-grid3">
        <div className="dw-step">
          <div className="num">1</div>
          <h3>Send BNB via Binance</h3>
          <p>Open your Binance app and send BNB (BEP20) to the deposit address shown below. Keep your transaction hash (TXID) safe.</p>
        </div>
        <div className="dw-step">
          <div className="num">2</div>
          <h3>Submit your TXID</h3>
          <p>Go to the Deposit page, enter your name, phone, amount and the Binance transaction ID. Your request goes to pending.</p>
        </div>
        <div className="dw-step">
          <div className="num">3</div>
          <h3>Admin approves → balance credited</h3>
          <p>The admin verifies your payment on Binance and approves it. Your Draz Wallet balance is updated and you can withdraw anytime.</p>
        </div>
      </div>

      <div className="dw-address-box">
        <div className="label">Official Binance (BNB BEP20) deposit address</div>
        <div className="addr">{DEPOSIT_ADDRESS}</div>
        <button className="btn btn-ghost btn-sm" onClick={copyAddr}>
          {copied ? '✓ Copied!' : 'Copy address'}
        </button>
        <div className="field" style={{ marginTop: 14 }}>
          <div className="hint">
            Only send BNB on the BEP20 (BSC) network. Sending any other coin or network may result in permanent loss.
          </div>
        </div>
      </div>

      <div className="dw-card" style={{ marginTop: 24 }}>
        <h2>Withdraw anytime</h2>
        <div className="sub">
          Need your money back? Submit a withdrawal request with your Binance ID.
          The admin sends the BNB to your address and approves the request.
        </div>
        <button className="btn btn-gold" onClick={() => go('withdraw')}>Request withdrawal</button>
      </div>
    </div>
  );
}
