import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="ChatSphere introduction">
        <div className="auth-brand-header">
          <div className="auth-logo" aria-hidden="true">C</div>
          <span className="auth-brand-name">ChatSphere</span>
        </div>
        <div className="auth-brand-copy">
          <p className="auth-eyebrow">TEAM COMMUNICATION</p>
          <h1>Work together.<br />Stay connected.</h1>
          <p className="auth-description">A focused workspace for conversations, projects, and the people who move them forward.</p>
          <div className="auth-accent" aria-hidden="true" />
          <ul className="auth-features">
            <li>Organized team conversations</li>
            <li>Real-time messaging</li>
            <li>Groups, files, and presence</li>
          </ul>
        </div>
        <p className="auth-brand-footer">© 2026 ChatSphere</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-shell">
          <header className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your workspace.</p>
          </header>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-password-wrap">
                <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="auth-options">
              <label className="auth-checkbox"><input type="checkbox" /><span>Remember me</span></label>
              <button type="button" className="auth-link-button">Forgot password?</button>
            </div>

            <button type="submit" className="auth-primary-button">Sign in</button>

            <div className="auth-divider" aria-hidden="true"><span /><b>OR</b><span /></div>

            <button type="button" className="auth-sso-button"><span className="auth-google-mark" aria-hidden="true">G</span>Continue with Google</button>
          </form>

          <p className="auth-register-prompt">New to ChatSphere? <Link to="/register">Create an account</Link></p>
          <p className="auth-support">Need help? Contact your workspace admin.</p>
        </div>
      </section>
    </main>
  );
};

export default Login;
