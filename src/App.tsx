import React, { useState, useEffect, useCallback } from 'react';
import { supabase, UserRecord, DanhMucRecord, DanhSachTrangWebRecord } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { LinkManagement } from './components/LinkManagement';
import { CategoryManagement } from './components/CategoryManagement';
import { UserManagement } from './components/UserManagement';
import { WebPortal } from './components/WebPortal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AlertCircle, Building2, Eye } from 'lucide-react';

function MainApp() {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'links' | 'categories' | 'users' | 'portal'>('links');

  // Bộ đếm số lượt truy cập Trang
  const [visitCount, setVisitCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('dau_web_visit_count');
      const val = saved ? parseInt(saved, 10) : 1286;
      return isNaN(val) ? 1286 : val;
    } catch {
      return 1286;
    }
  });

  useEffect(() => {
    try {
      const sessionCounted = sessionStorage.getItem('dau_session_counted');
      if (!sessionCounted) {
        sessionStorage.setItem('dau_session_counted', 'true');
        setVisitCount((prev) => {
          const next = prev + 1;
          localStorage.setItem('dau_web_visit_count', String(next));
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Supabase Data State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [categories, setCategories] = useState<DanhMucRecord[]>([]);
  const [links, setLinks] = useState<DanhSachTrangWebRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Password modal for current user
  const [isSelfPasswordModalOpen, setIsSelfPasswordModalOpen] = useState(false);

  // Fetch all tables from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Users
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('*')
        .order('id', { ascending: true });

      if (userError) {
        console.error('Lỗi tải bảng user:', userError);
      } else if (userData) {
        setUsers(userData as UserRecord[]);
      }

      // 2. Fetch Danh Mục Web
      const { data: catData, error: catError } = await supabase
        .from('danhmucweb')
        .select('*')
        .order('id', { ascending: true });

      if (catError) {
        console.error('Lỗi tải bảng danhmucweb:', catError);
      } else if (catData) {
        setCategories(catData as DanhMucRecord[]);
      }

      // 3. Fetch Danh Sách Trang Web
      const { data: linkData, error: linkError } = await supabase
        .from('danhsachtrangweb')
        .select('*')
        .order('id', { ascending: true });

      if (linkError) {
        console.error('Lỗi tải bảng danhsachtrangweb:', linkError);
      } else if (linkData) {
        setLinks(linkData as DanhSachTrangWebRecord[]);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối Supabase');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'users') {
      setActiveTab('links');
    }
  }, [isAdmin, activeTab]);

  // Statistics
  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.hieuluc).length;
  const inactiveLinks = totalLinks - activeLinks;
  const totalCategories = categories.length;
  const totalUsers = users.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-red-500 selection:text-white">
      {/* Header with Navigation and Auth */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openChangePasswordModal={() => setIsSelfPasswordModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={fetchData}
              className="text-xs font-semibold underline text-red-700 hover:text-red-900"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Global Summary Metric Cards */}
        <StatsOverview
          totalLinks={totalLinks}
          activeLinks={activeLinks}
          inactiveLinks={inactiveLinks}
          totalCategories={totalCategories}
          totalUsers={totalUsers}
          onRefresh={fetchData}
          isLoading={isLoading}
        />

        {/* View Selection */}
        {activeTab === 'links' && (
          <LinkManagement
            links={links}
            categories={categories}
            onRefresh={fetchData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManagement
            categories={categories}
            links={links}
            onRefresh={fetchData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement
            users={users}
            onRefresh={fetchData}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'portal' && (
          <WebPortal
            links={links}
            categories={categories}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-red-600" />
            <span className="font-semibold text-slate-800">
              Trường Đại học Kiến trúc Đà Nẵng
            </span>
            <span>-</span>
            <span>Hệ thống Quản lý Tiện ích Web</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Email: <strong className="text-slate-700">tcns@dau.edu.vn</strong></span>
            <span>•</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-medium">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Số lượt truy cập:</span>
              <span className="text-red-600 font-bold font-mono text-xs">{visitCount.toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Self Password Modal */}
      <ChangePasswordModal
        isOpen={isSelfPasswordModalOpen}
        onClose={() => setIsSelfPasswordModalOpen(false)}
        targetUserId={currentUser?.id}
        targetUsername={currentUser?.username}
        onSuccess={fetchData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
