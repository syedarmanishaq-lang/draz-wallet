import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Account from './pages/Account';
import Admin from './pages/Admin';

const PAGES = ['home', 'deposit', 'withdraw', 'account', 'admin'];

function pageFromHash() {
  const h = window.location.hash.replace('#/', '').replace('#', '');
  if (h === 'admin' || h === 'admin/') return 'admin';
  return PAGES.includes(h) ? h : 'home';
}

export default function App() {
  const [page, setPage] = useState(pageFromHash());

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (p) => {
    window.location.hash = '#/' + p;
    setPage(p);
    window.scrollTo(0, 0);
  };

  const nav = (p, label) => (
    <button key={p} className={page === p ? 'active' : ''} onClick={() => go(p)}>
      {label}
    </button>
  );

  return (
    <div className="dw-shell">
      <nav className="dw-nav">
        <div className="dw-brand" onClick={() => go('home')}>
          <div className="dw-logo">$</div>
          <div>
            <b>Draz Wallet</b>
            <small>Binance payments for Daraz</small>
          </div>
        </div>
        <div className="dw-links">
          {nav('home', 'Home')}
          {nav('deposit', 'Deposit')}
          {nav('withdraw', 'Withdraw')}
          {nav('account', 'My Account')}
        </div>
      </nav>

      <main className="dw-main">
        {page === 'home' && <Home go={go} />}
        {page === 'deposit' && <Deposit go={go} />}
        {page === 'withdraw' && <Withdraw go={go} />}
        {page === 'account' && <Account go={go} />}
        {page === 'admin' && <Admin />}
      </main>

      <footer className="dw-footer">
        Draz Wallet — secure Binance (BNB) payments for Daraz customers.
      </footer>
    </div>
  );
}
