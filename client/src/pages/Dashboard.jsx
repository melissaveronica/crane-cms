import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="p-6">
      <h1 className="text-3xl font-poppins font-semibold text-bgray-900 dark:text-white mb-2">
        Welcome{user ? `, ${user.email}` : ''}
      </h1>
      <p className="font-urbanist text-bgray-600 dark:text-bgray-100">
        Role: {user?.role}
      </p>
    </div>
  );
}
