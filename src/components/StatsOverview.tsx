import React from 'react';
import { Globe, CheckCircle2, XCircle, FolderTree, Users, RefreshCw } from 'lucide-react';

interface StatsProps {
  totalLinks: number;
  activeLinks: number;
  inactiveLinks: number;
  totalCategories: number;
  totalUsers: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const StatsOverview: React.FC<StatsProps> = ({
  totalLinks,
  activeLinks,
  inactiveLinks,
  totalCategories,
  totalUsers,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Tổng trang Web</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{totalLinks}</h4>
          <span className="text-[11px] text-blue-700 font-medium">table: danhsachtrangweb</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Đang hoạt động</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{activeLinks}</h4>
          <span className="text-[11px] text-emerald-700 font-medium">Hiệu lực = true</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Tạm vô hiệu</p>
          <h4 className="text-2xl font-bold text-rose-500 mt-1">{inactiveLinks}</h4>
          <span className="text-[11px] text-rose-600 font-medium">hiệu lực = false</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <XCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Danh mục Web</p>
          <h4 className="text-2xl font-bold text-purple-600 mt-1">{totalCategories}</h4>
          <span className="text-[11px] text-purple-700 font-medium">table: danhmucweb</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <FolderTree className="w-5 h-5" />
        </div>
      </div>

      <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Người dùng</p>
          <h4 className="text-2xl font-bold text-amber-600 mt-1">{totalUsers}</h4>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 mt-0.5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
            Làm mới CSDL
          </button>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
