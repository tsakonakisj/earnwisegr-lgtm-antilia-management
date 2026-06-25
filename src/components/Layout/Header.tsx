import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { loadCompanyConfig } from '../../lib/company';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    loadCompanyConfig().then((cfg) => setCompanyName(cfg.name));

    const onStorage = () => {
      loadCompanyConfig().then((cfg) => setCompanyName(cfg.name));
    };
    window.addEventListener('company-settings-updated', onStorage);
    return () => window.removeEventListener('company-settings-updated', onStorage);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">{companyName}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'el' | 'en')}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="el">Ελληνικά</option>
                <option value="en">English</option>
              </select>
              <GlobeAltIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* User Menu */}
            <div className="relative">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-700">{user?.name}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;