import { useEffect, useState } from "react"
import api from "../../services/api";
import { Link } from "react-router-dom";

const CustomerManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [dateFilter, setDateFilter] = useState('');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'createdAt', label: 'Registration Date', sortable: true }
    ];

    const datePresets = [
        { value: '', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'custom', label: 'Custom Range' }
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const params = {
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction,
                    dateFilter,
                    startDate: customDateRange.start,
                    endDate: customDateRange.end
                };
                const { data } = await api.get(`/super-admin/users/regular`, { params });
                setUsers(data.users);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [sortConfig, dateFilter, customDateRange]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <div className="text-2xl">👥</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Customer Directory</h3>
                </div>
                <div className="flex items-center gap-4">
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        {datePresets.map(preset => (
                            <option key={preset.value} value={preset.value}>{preset.label}</option>
                        ))}
                    </select>
                    
                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-500 dark:text-gray-400">to</span>
                            <input
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                {columns.map(column => (
                                    <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        <div className="flex items-center space-x-1">
                                            <span>{column.label}</span>
                                            {column.sortable && (
                                                <button
                                                    onClick={() => handleSort(column.key)}
                                                    className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    {sortConfig.key === column.key ? (
                                                        sortConfig.direction === 'asc' ? (
                                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        )
                                                    ) : (
                                                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M5 12l5-5 5 5H5z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map((user, index) => (
                                <tr key={user._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{user.name}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <Link to={`/super-admin/user/${user._id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors duration-200">View Details</Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="text-4xl text-gray-300 dark:text-gray-600">👥</div>
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">No customers found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CustomerManager;