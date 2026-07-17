import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();          // without this the browser does a full page reload
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white dark:bg-darkblack-500">
      <div className="flex flex-col lg:flex-row justify-between min-h-screen">
        {/* Left */}
        <div className="lg:w-1/2 px-5 xl:pl-12 pt-10">
          <header>
            <Link to="/login">
              <span className="font-poppins text-2xl font-bold text-bgray-900 dark:text-white">
                Crane<span className="text-success-300">CMS</span>
              </span>
            </Link>
          </header>
          <div className="max-w-[450px] m-auto pt-24 pb-16">
            <header className="text-center mb-8">
              <h2 className="text-bgray-900 dark:text-white text-4xl font-semibold font-poppins mb-2">
                Sign in to Crane CMS
              </h2>
              <p className="font-urbanist text-base font-medium text-bgray-600 dark:text-bgray-50">
                Manage your clients, orders and invoices
              </p>
            </header>

            {error && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-error-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                  className="text-bgray-800 dark:text-white dark:bg-darkblack-500 text-base border border-bgray-300 dark:border-darkblack-400 h-14 w-full focus:border-success-300 focus:ring-0 rounded-lg px-4 py-3.5 placeholder:text-bgray-500 placeholder:text-base"
                />
              </div>
              <div className="mb-6 relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="text-bgray-800 dark:text-white dark:bg-darkblack-500 text-base border border-bgray-300 dark:border-darkblack-400 h-14 w-full focus:border-success-300 focus:ring-0 rounded-lg px-4 py-3.5 placeholder:text-bgray-500 placeholder:text-base"
                />
              </div>
              <div className="flex justify-between mb-7">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 dark:bg-darkblack-500 focus:ring-transparent rounded-full border border-bgray-300 focus:accent-success-300 text-success-300"
                    name="remember"
                    id="remember"
                  />
                  <label htmlFor="remember" className="text-bgray-900 dark:text-white text-base font-semibold">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="py-3.5 flex items-center justify-center text-white font-bold bg-success-300 hover:bg-success-400 disabled:opacity-50 transition-all rounded-lg w-full"
              >
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-bgray-900 dark:text-bgray-50 text-base font-medium pt-7">
              Don&rsquo;t have an account?{' '}
              <Link to="/register" className="font-semibold underline">
                Register
              </Link>
            </p>

            <p className="text-bgray-600 dark:text-white text-center text-sm mt-6">
              &copy; 2026 Crane CMS. All Right Reserved.
            </p>
          </div>
        </div>

        {/* Right (illustration side, from signin.html) */}
        <div className="lg:w-1/2 lg:block hidden bg-[#F6FAFF] dark:bg-darkblack-600 p-20 relative">
          <ul>
            <li className="absolute top-10 left-8">
              <img src="/assets/images/shapes/square.svg" alt="" />
            </li>
            <li className="absolute right-12 top-14">
              <img src="/assets/images/shapes/vline.svg" alt="" />
            </li>
            <li className="absolute bottom-7 left-8">
              <img src="/assets/images/shapes/dotted.svg" alt="" />
            </li>
          </ul>
          <div>
            <img src="/assets/images/illustration/signin.svg" alt="" />
          </div>
          <div>
            <div className="text-center max-w-lg px-1.5 m-auto">
              <h3 className="text-bgray-900 dark:text-white font-semibold font-poppins text-4xl mb-4">
                Speedy, Easy and Fast
              </h3>
              <p className="text-bgray-600 dark:text-bgray-50 text-sm font-medium">
                Crane CMS helps you track orders, manage invoices and keep every
                client relationship organized in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
