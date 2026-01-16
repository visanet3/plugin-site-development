import React, { useState } from 'react';
import { Home, PieChart, Users, Briefcase, CheckSquare } from 'lucide-react';

// --- Data for each page ---
const pageContent = {
    Dashboard: {
        title: 'Dashboard',
        description: "Welcome back, Admin. Here's what's happening today.",
        content: (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="content-card">
                    <h2 className="text-lg font-semibold text-white">Active Users</h2>
                    <p className="text-4xl font-bold mt-2 text-indigo-400">128</p>
                </div>
                <div className="content-card">
                    <h2 className="text-lg font-semibold text-white">Pending Withdrawals</h2>
                    <p className="text-4xl font-bold mt-2 text-pink-400">15</p>
                </div>
                <div className="content-card">
                    <h2 className="text-lg font-semibold text-white">Active Deals</h2>
                    <p className="text-4xl font-bold mt-2 text-emerald-400">42</p>
                </div>
            </div>
        )
    },
    Analytics: {
        title: 'Analytics',
        description: 'Detailed insights and metrics for your platform.',
        content: (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="content-card lg:col-span-2 h-64 flex items-center justify-center">
                    <p className="text-gray-400">Chart placeholder for User Growth</p>
                </div>
                <div className="content-card">
                    <h2 className="text-lg font-semibold text-white">Transaction Volume</h2>
                    <p className="text-4xl font-bold mt-2 text-indigo-400">$124.5K</p>
                </div>
                <div className="content-card">
                    <h2 className="text-lg font-semibold text-white">Avg Response Time</h2>
                    <p className="text-4xl font-bold mt-2 text-pink-400">2m 18s</p>
                </div>
            </div>
        )
    },
    Users: {
        title: 'Users',
        description: 'Manage all the users in your platform.',
        content: (
            <div className="content-card">
                <table className="custom-table">
                    <thead>
                        <tr><th>Username</th><th>Email</th><th>Balance</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>john_crypto</td><td>john@example.com</td><td>$1,234</td><td>Active</td></tr>
                        <tr><td>trader_mike</td><td>mike@example.com</td><td>$5,678</td><td>Active</td></tr>
                        <tr><td>crypto_alice</td><td>alice@example.com</td><td>$890</td><td>Verified</td></tr>
                    </tbody>
                </table>
            </div>
        )
    },
    Projects: {
        title: 'Deals',
        description: 'Overview of all active and completed deals.',
        content: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="content-card">
                    <h2 className="text-lg font-semibold text-white">Deal #1024</h2>
                    <p className="text-sm text-gray-400 mt-1">Status: In Progress</p>
                    <p className="text-sm text-gray-400">Amount: $2,500</p>
                </div>
                <div className="content-card">
                    <h2 className="text-lg font-semibold text-white">Deal #1023</h2>
                    <p className="text-sm text-gray-400 mt-1">Status: Completed</p>
                    <p className="text-sm text-gray-400">Amount: $1,200</p>
                </div>
            </div>
        )
    },
    Tasks: {
        title: 'Support Tickets',
        description: 'Track and manage all support requests.',
        content: (
            <div className="content-card">
                <ul>
                    <li className="task-list-item">
                        <span>Withdrawal request verification</span>
                        <span className="text-xs text-pink-400">High Priority</span>
                    </li>
                    <li className="task-list-item">
                        <span>Account verification review</span>
                        <span className="text-xs text-gray-400">In Progress</span>
                    </li>
                    <li className="task-list-item">
                        <span>Payment dispute resolution</span>
                        <span className="text-xs text-emerald-400">Resolved</span>
                    </li>
                </ul>
            </div>
        )
    }
};

const navItems = [
    { page: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { page: 'Analytics', icon: <PieChart className="w-5 h-5" /> },
    { page: 'Users', icon: <Users className="w-5 h-5" /> },
    { page: 'Projects', icon: <Briefcase className="w-5 h-5" /> },
    { page: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
];

// Sidebar Component
const Sidebar = ({ activePage, setActivePage }: { activePage: string; setActivePage: (page: string) => void }) => (
    <aside className="glass-effect w-64 flex-shrink-0 flex flex-col z-10">
        <div className="h-20 flex items-center justify-center border-b border-white/10">
            <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                <span className="text-xl font-bold text-white">CryptoDesk</span>
            </div>
        </div>
        <nav className="flex-grow p-4 space-y-2">
            {navItems.map(item => (
                <a
                    key={item.page}
                    href="#"
                    className={`nav-link flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 transition-colors hover:bg-white/5 ${activePage === item.page ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        setActivePage(item.page);
                    }}
                >
                    {item.icon}
                    <span>{item.page}</span>
                </a>
            ))}
        </nav>
        <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/150?u=admin" alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-400" />
                <div>
                    <p className="font-semibold text-white">Admin</p>
                    <p className="text-xs text-gray-400">Administrator</p>
                </div>
            </div>
        </div>
    </aside>
);

// Main Content Component
const MainContent = ({ activePage }: { activePage: string }) => {
    const { title, description, content } = pageContent[activePage as keyof typeof pageContent];
    return (
        <main className="flex-grow p-8 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-gray-400 mt-2">{description}</p>
            <div className="mt-8">{content}</div>
        </main>
    );
};

// Main Dashboard Layout Component
export const DashboardLayout = () => {
    const [activePage, setActivePage] = useState('Dashboard');
    return (
        <div className="relative min-h-screen w-full flex bg-gray-900 text-gray-200">
            <div className="shape-1"></div>
            <div className="shape-2"></div>
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <MainContent activePage={activePage} />
        </div>
    );
};
