import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const initial = {
  company_name: '',
  registration_no: '',
  pic_name: '',
  phone: '',
  email: '',
  address: '',
  industry: '',
  password: '',
};

const inputClass =
  'text-bgray-800 dark:text-white dark:bg-darkblack-500 dark:border-darkblack-400 text-base border border-bgray-300 h-14 w-full focus:border-success-300 focus:ring-0 rounded-lg px-4 py-3.5 placeholder:text-bgray-500 placeholder:text-base';

export default function Register() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/register', form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className="bg-white dark:bg-darkblack-500 min-h-screen flex items-center justify-center">
        <div className="max-w-[450px] text-center px-5">
          <h2 className="text-bgray-900 dark:text-white text-3xl font-semibold font-poppins mb-4">
            Registration submitted
          </h2>
          <p className="font-urbanist text-bgray-600 mb-6">
            Your account is awaiting admin approval. You'll be able to sign in once it's approved.
          </p>
          <Link to="/login" className="font-semibold text-success-300 underline">
            Back to sign in
          </Link>
        </div>
      </section>
    );
  }

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

          <div className="max-w-[460px] m-auto pt-16 pb-16">
            <header className="text-center mb-8">
              <h2 className="text-bgray-900 dark:text-white text-4xl font-semibold font-poppins mb-2">
                Register your company
              </h2>
              <p className="font-urbanist text-base font-medium text-bgray-600 dark:text-darkblack-300">
                Create a customer account
              </p>
            </header>

            {error && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-error-300 text-sm">
                {error}
              </div>
            )}

            {/* Form (adapted from signup.html) */}
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
                <div className="flex-1">
                  <input
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                    placeholder="Company name"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <input
                    name="registration_no"
                    value={form.registration_no}
                    onChange={handleChange}
                    required
                    placeholder="Registration number"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
                <div className="flex-1">
                  <input
                    name="pic_name"
                    value={form.pic_name}
                    onChange={handleChange}
                    required
                    placeholder="Person in charge"
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="Phone"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mb-4">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Email"
                  className={inputClass}
                />
              </div>
              <div className="mb-4">
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="Address"
                  className={inputClass}
                />
              </div>
              <div className="mb-4">
                <input
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Industry (optional)"
                  className={inputClass}
                />
              </div>
              <div className="mb-6 relative">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Password (min 8 characters)"
                  className={inputClass}
                />
              </div>
              <div className="flex justify-between mb-7">
                <div className="flex items-center gap-x-3">
                  <input
                    type="checkbox"
                    required
                    className="w-5 h-5 focus:ring-transparent rounded-md border border-bgray-300 focus:accent-success-300 text-success-300 dark:bg-transparent dark:border-darkblack-400"
                    name="terms"
                    id="terms"
                  />
                  <label htmlFor="terms" className="text-bgray-600 dark:text-bgray-50 text-base">
                    By creating an account, you are agreeing to our{' '}
                    <span className="text-bgray-900 dark:text-white">Privacy Policy</span>.
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="py-3.5 flex items-center justify-center text-white font-bold bg-success-300 hover:bg-success-400 disabled:opacity-50 transition-all rounded-lg w-full"
              >
                {busy ? 'Submitting…' : 'Register'}
              </button>
            </form>

            <p className="text-center text-bgray-900 dark:text-bgray-50 text-base font-medium pt-7">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold underline">
                Sign In
              </Link>
            </p>

            <p className="text-bgray-600 dark:text-darkblack-300 text-center text-sm mt-6">
              &copy; 2026 Crane CMS. All Right Reserved.
            </p>
          </div>
        </div>

        {/* Right (illustration side, from signup.html) */}
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
          <div className="mb-10">
            <img src="/assets/images/illustration/signup.svg" alt="" />
          </div>
          <div>
            <div className="text-center max-w-lg px-1.5 m-auto">
              <h3 className="text-bgray-900 dark:text-white font-semibold font-poppins text-4xl mb-4">
                Speedy, Easy and Fast
              </h3>
              <p className="text-bgray-600 dark:text-darkblack-300 text-sm font-medium">
                Register your company to start placing orders and tracking
                invoices with Crane CMS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
