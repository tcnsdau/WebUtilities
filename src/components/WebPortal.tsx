import React, { useState, useMemo } from 'react';
import { DanhMucRecord, DanhSachTrangWebRecord } from '../lib/supabase';
import {
  Globe,
  ExternalLink,
  Search,
  FolderTree,
  Copy,
  Check,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  X
} from 'lucide-react';

interface WebPortalProps {
  links: DanhSachTrangWebRecord[];
  categories: DanhMucRecord[];
}

export const WebPortal: React.FC<WebPortalProps> = ({ links, categories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => map.set(c.id, c.phanloai));
    return map;
  }, [categories]);

  // Only show active websites by default in the public utility portal, but allow user to see all if needed
  const filteredLinks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return links.filter((item) => {
      const matchesCategory =
        activeCategoryId === 'all' || item.phanloai === activeCategoryId;

      const matchesSearch =
        !term ||
        item.ten?.toLowerCase().includes(term) ||
        item.link?.toLowerCase().includes(term) ||
        (item.mota && item.mota.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  }, [links, searchTerm, activeCategoryId]);

  const handleCopy = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get domain name for favicon / badge
  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-red-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-rose-100 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Cổng tiện ích trực tuyến
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Kho tiện ích & Liên kết Công cụ trực tuyến
          </h2>
          <p className="text-sm sm:text-base text-rose-100 mt-2 leading-relaxed">
            Tra cứu nhanh và truy cập an toàn các công cụ chuyển đổi file, tải video, tài nguyên học tập và cổng dịch vụ nội bộ đã được kiểm duyệt.
          </p>

          {/* Quick Search */}
          <div className="mt-5 relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm công cụ: SnapTik, PDF, converter, link..."
              className="w-full pl-11 pr-10 py-3 bg-white text-slate-900 rounded-2xl text-sm font-medium shadow-md focus:outline-none focus:ring-4 focus:ring-white/30 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategoryId('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeCategoryId === 'all'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tất Cả Danh Mục ({links.length})
        </button>

        {categories.map((c) => {
          const count = links.filter((l) => l.phanloai === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategoryId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategoryId === c.id
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              {c.phanloai} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      {filteredLinks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Không tìm thấy tiện ích phù hợp</h4>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng thử từ khóa khác hoặc chọn phân loại danh mục khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item) => {
            const catName = categoryMap.get(item.phanloai) || `Nhóm #${item.phanloai}`;
            const domain = getDomain(item.link);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between hover:shadow-md ${
                  item.hieuluc ? 'border-slate-200 hover:border-red-300' : 'border-slate-200 opacity-60 bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                        {item.ten.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 inline-block mb-1">
                          {catName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1" title={item.ten}>
                          {item.ten}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        item.hieuluc
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.hieuluc ? 'Hoạt động' : 'Tạm ngừng'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] mb-4">
                    {item.mota || 'Tiện ích trực tuyến hỗ trợ công việc'}
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500 mb-4">
                    <span className="truncate max-w-[200px]" title={item.link}>
                      {domain}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.link)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Sao chép đường dẫn"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-blue-700 font-mono">#{item.id}</span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Truy Cập Trang Web
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
