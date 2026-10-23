import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  FolderTree,
  Users,
  LayoutGrid,
  ShieldAlert,
  ShieldCheck,
  LogIn,
  LogOut,
  KeyRound,
  Building2
} from 'lucide-react';
import { LoginModal } from './LoginModal';

interface HeaderProps {
  activeTab: 'links' | 'categories' | 'users' | 'portal';
  setActiveTab: (tab: 'links' | 'categories' | 'users' | 'portal') => void;
  openChangePasswordModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, openChangePasswordModal }) => {
  const { currentUser, isAdmin, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        {/* Top Info Bar */}
        <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-semibold text-rose-400">
                <Building2 className="w-3.5 h-3.5" />
                Trường Đại học Kiến trúc Đà Nẵng
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Email Quản trị: <span className="text-amber-300 font-mono">tcns@dau.edu.vn</span>
              </span>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Kết Nối Trực Tiếp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 flex items-center justify-center text-white shadow-md shadow-red-200">
                <Globe className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                    Hệ thống Quản lý Tiện ích WEB
                  </h1>
                  <span className="text-[11px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-200">
                    DAU - Danang Architecture University
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân loại danh mục, lưu trữ liên kết công cụ và phân quyền người dùng
                </p>
              </div>
            </div>

            {/* Auth status & actions */}
            <div className="flex items-center gap-2.5">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pr-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isAdmin ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <span>{currentUser.username}</span>
                      {isAdmin ? (
                        <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                          Admin Toàn Quyền
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">
                          Chỉ Xem
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{currentUser.email}</div>
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
                    <button
                      onClick={openChangePasswordModal}
                      title="Đổi mật khẩu tài khoản hiện tại"
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={logout}
                      title="Đăng xuất"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hidden sm:inline-flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Chế độ Khách (Chỉ Xem)
                  </span>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Đăng nhập
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setActiveTab('links')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'links'
                    ? 'bg-red-600 text-white shadow-xs shadow-red-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-4 h-4" />
                Quản lý liên kết trang Web
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'bg-red-600 text-white shadow-xs shadow-red-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                Danh mục Phân loại
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'users'
                      ? 'bg-red-600 text-white shadow-xs shadow-red-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Quản lý Tài khoản (User)
                </button>
              )}

              <button
                onClick={() => setActiveTab('portal')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'portal'
                    ? 'bg-red-600 text-white shadow-xs shadow-red-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Cổng tra cứu Tiện ích
              </button>
            </nav>

            {/* Quick banner indicating style standard */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="font-semibold text-red-600">Danang Architecture University</span>
              <span>•</span>
              <span className="font-medium text-blue-700 lowercase"> </span>
            </div>
          </div>
        </div>
      </header>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};
