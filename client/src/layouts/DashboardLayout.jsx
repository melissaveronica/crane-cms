import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STAFF_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/clients', label: 'Clients' },
  { to: '/orders', label: 'Orders' },
  { to: '/invoices', label: 'Invoices' },
];
const CUSTOMER_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/orders', label: 'Orders' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/documents', label: 'Documents' },
  { to: '/profile', label: 'Profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  const NAV = user?.role === 'customer' ? CUSTOMER_NAV : STAFF_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeLabel = NAV.find((n) => location.pathname.startsWith(n.to))?.label || 'Dashboard';

  return (
    <div className="layout-wrapper active w-full">
      <div className="relative flex w-full">
        {/* Sidebar (adapted from Bankco index.html #sidebar-wrapper) */}
        <aside className="sidebar-wrapper fixed top-0 z-30 hidden h-full w-[280px] bg-white dark:bg-darkblack-600 sm:block">
          <div className="sidebar-header relative z-30 flex h-[108px] w-full items-center border-b border-r border-b-[#F7F7F7] border-r-[#F7F7F7] pl-[40px] dark:border-darkblack-400">
            <Link to="/dashboard">
              <span className="font-poppins text-2xl font-bold text-bgray-900 dark:text-white">
                Crane<span className="text-success-300">CMS</span>
              </span>
            </Link>
          </div>
          <div className="sidebar-body overflow-style-none relative z-30 h-screen w-full overflow-y-scroll pb-[200px] pl-[40px] pt-[14px]">
            <div className="nav-wrapper mb-[36px] pr-[40px]">
              <div className="item-wrapper mb-5">
                <h4 className="border-b border-bgray-200 text-sm font-medium leading-7 text-bgray-700 dark:border-darkblack-400 dark:text-bgray-50">
                  Menu
                </h4>
                <ul className="mt-2.5">
                  {NAV.map((item) => {
                    const active = location.pathname.startsWith(item.to);
                    return (
                      <li
                        key={item.to}
                        className={`item py-[11px] ${
                          active ? 'text-success-300' : 'text-bgray-900 dark:text-white'
                        }`}
                      >
                        <Link to={item.to}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <span className="item-ico">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                              </span>
                              <span className="item-text text-lg font-medium leading-none">
                                {item.label}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="w-full sm:pl-[280px]">
          <header className="header-wrapper fixed z-30 hidden w-[calc(100%-280px)] sm:block">
            <div className="relative flex h-[108px] w-full items-center justify-between bg-white px-10 dark:bg-darkblack-600">
              {/* page title */}
              <div>
                <h3 className="text-xl font-bold text-bgray-900 dark:text-bgray-50 lg:text-3xl lg:leading-[36.4px]">
                  {activeLabel}
                </h3>
                <p className="text-xs font-medium text-bgray-600 dark:text-bgray-50 lg:text-sm lg:leading-[25.2px]">
                  Let&rsquo;s check your update today
                </p>
              </div>

              {/* search bar */}
              <div className="searchbar-wrapper">
                <div className="px flex h-[56px] w-[300px] items-center justify-between rounded-lg border border-transparent bg-bgray-50 px-4 focus-within:border-success-300 dark:bg-darkblack-500 lg:w-[360px]">
                  <div className="flex w-full items-center space-x-3.5">
                    <span>
                      <svg
                        className="stroke-bgray-900 dark:stroke-bgray-50"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="9.78639" cy="9.78602" r="8.23951" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15.5176 15.9447L18.7479 19.1667" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="search-input w-full border-none bg-bgray-50 bg-none px-0 text-sm tracking-wide text-bgray-600 placeholder:text-sm placeholder:font-semibold focus:outline-none focus:ring-0 dark:bg-darkblack-500 dark:placeholder:text-bgray-500"
                    />
                  </div>
                </div>
              </div>

              {/* quick access / profile */}
              <div className="quick-access-wrapper relative">
                <div className="flex items-center space-x-[24px]">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center space-x-3 rounded-lg px-2 py-1 hover:bg-bgray-100 dark:hover:bg-darkblack-500"
                  >
                    <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-success-50 text-sm font-bold text-success-300 dark:bg-darkblack-500">
                      {(user?.company_name || user?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden text-left xl:block">
                      <p className="text-sm font-semibold text-bgray-900 dark:text-white">
                        {user?.company_name || user?.email}
                      </p>
                      <p className="text-xs font-medium text-bgray-500 dark:text-bgray-400">
                        {user?.role || 'user'}
                      </p>
                    </div>
                  </button>

                  {profileOpen && (
                    <div
                      style={{ filter: 'drop-shadow(12px 12px 40px rgba(0, 0, 0, 0.08))' }}
                      className="profile-box absolute right-0 top-[64px] w-[220px] overflow-hidden rounded-lg bg-white dark:bg-darkblack-600"
                    >
                      <div className="relative w-full px-3 py-2">
                        <div>
                          <ul>
                            <li className="w-full">
                              <div className="rounded-lg p-[14px] text-bgray-600 dark:text-bgray-50">
                                <span className="text-sm font-semibold">{user?.email}</span>
                              </div>
                            </li>
                            <li className="w-full">
                              <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center space-x-[10px] rounded-lg p-[14px] text-error-300 hover:bg-bgray-100 dark:hover:bg-darkblack-500"
                              >
                                <span className="text-sm font-semibold">Log Out</span>
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="w-full px-6 pb-6 pt-[128px] xl:px-[48px] xl:pb-[48px]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
