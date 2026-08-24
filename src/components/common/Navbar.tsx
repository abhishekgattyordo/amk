import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, Building2, ChevronDown, User, LogOut, ShieldCheck, Globe, HelpCircle, Menu, Settings, Info, AlertTriangle, CheckCircle2, XCircle, Mail, Check } from 'lucide-react';
import { NotificationItem, User as UserType } from '../../types';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  currentUser: UserType;
  onLogout: () => void;
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeCompany: string;
  onSelectCompany: (company: string) => void;
  onGlobalSearchClick: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenNotificationSettings?: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onNotificationClick?: (notif: NotificationItem) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  notifications,
  onClearNotifications,
  darkMode,
  onToggleDarkMode,
  activeCompany,
  onSelectCompany,
  onGlobalSearchClick,
  onToggleMobileSidebar,
  onOpenNotificationSettings,
  onMarkNotificationRead,
  onNotificationClick,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'procurement'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterTab === 'unread') return !n.read;
    if (filterTab === 'procurement') return n.module === 'Procurement';
    return true;
  });
  const companies = [
    'AMK Carton Mills Ltd - HQ',
    'AMK Corrugated Packaging Plant #2',
    'AMK Kraft Paper Division'
  ];

  return (
    <header className={`h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors ${
      darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Left: Hamburger (mobile), Company Switcher & Global Search Trigger */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile menu button */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className={`p-2 rounded-lg lg:hidden transition-colors ${
              darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowCompanyMenu(!showCompanyMenu)}
            className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[200px]">{activeCompany}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {showCompanyMenu && (
            <div className={`absolute left-0 mt-2 w-72 rounded-xl shadow-xl border py-2 z-50 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Manufacturing Unit
              </div>
              {companies.map(comp => (
                <button
                  key={comp}
                  onClick={() => {
                    onSelectCompany(comp);
                    setShowCompanyMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                    activeCompany === comp 
                      ? (darkMode ? 'bg-emerald-900/30 text-emerald-400 font-semibold' : 'bg-emerald-50 text-emerald-700 font-semibold')
                      : (darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50')
                  }`}
                >
                  <span className="truncate">{comp}</span>
                  {activeCompany === comp && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Button */}
        <button
          onClick={onGlobalSearchClick}
          className={`hidden md:flex items-center space-x-3 px-4 py-1.5 rounded-lg border text-sm w-80 transition-all ${
            darkMode 
              ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600' 
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-left">Search raw materials, products, suppliers...</span>
          <kbd className={`px-2 py-0.5 text-xs rounded font-mono ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'}`}>⌘K</kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-lg border transition-colors ${
            darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg border relative transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 sm:w-[420px] rounded-2xl shadow-2xl border py-3 z-50 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">Notification Center</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {onOpenNotificationSettings && (
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenNotificationSettings();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-800/50 transition-colors"
                      title="Procurement Notification Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={onClearNotifications}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center px-4 pt-2.5 pb-2 space-x-1 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterTab === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilterTab('unread')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterTab === 'unread'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilterTab('procurement')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterTab === 'procurement'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  Procurement ({notifications.filter(n => n.module === 'Procurement').length})
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredNotifications.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    No notifications match current filter.
                  </div>
                ) : (
                  filteredNotifications.map(notif => {
                    const isProcurement = notif.module === 'Procurement';
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (onNotificationClick) {
                            onNotificationClick(notif);
                          }
                          if (onMarkNotificationRead && !notif.read) {
                            onMarkNotificationRead(notif.id);
                          }
                          setShowNotifications(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative group cursor-pointer ${
                          !notif.read ? (darkMode ? 'bg-slate-800/40' : 'bg-emerald-50/50') : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{notif.title}</h4>
                            {notif.module && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                isProcurement ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/40 text-slate-400'
                              }`}>
                                {notif.module}
                              </span>
                            )}
                            {notif.priority && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                                notif.priority === 'Warning' ? 'bg-amber-500/20 text-amber-400' :
                                notif.priority === 'Success' ? 'bg-emerald-500/20 text-emerald-400' :
                                notif.priority === 'Error' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {notif.priority}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{notif.time}</span>
                        </div>

                        <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/50 pt-1.5">
                          {notif.emailSent ? (
                            <span className="inline-flex items-center text-blue-400 font-semibold">
                              <Mail className="w-3 h-3 mr-1" /> Email Sent ({notif.emailRecipient || 'Purchase Mgr'})
                            </span>
                          ) : (
                            <span className="text-slate-500">In-App Notification</span>
                          )}

                          {onMarkNotificationRead && !notif.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkNotificationRead(notif.id);
                              }}
                              className="text-emerald-500 hover:underline font-bold flex items-center cursor-pointer"
                            >
                              <Check className="w-3 h-3 mr-0.5" /> Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center space-x-3 p-1.5 rounded-xl border transition-colors ${
              darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <UserAvatar
              name={currentUser.name}
              src={currentUser.avatar}
              size="md"
            />
            <div className="hidden sm:block text-left pr-2">
              <div className="text-xs font-bold truncate max-w-[110px]">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{currentUser.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                <UserAvatar
                  name={currentUser.name}
                  src={currentUser.avatar}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{currentUser.department}</span>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2 transition-colors ${
                    darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile & Preferences</span>
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2 transition-colors ${
                    darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Language & Currency (INR ₹)</span>
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center space-x-2 transition-colors ${
                    darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>AMK ERP Help & Documentation</span>
                </button>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs flex items-center space-x-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Secure Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
