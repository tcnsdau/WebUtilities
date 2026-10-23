import React, { useState, useMemo } from 'react';
import { supabase, DanhMucRecord, DanhSachTrangWebRecord } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../lib/excelExport';
import {
  Search,
  FileSpreadsheet,
  Plus,
  Globe,
  ExternalLink,
  Edit3,
  Trash2,
  Power,
  CheckCircle,
  XCircle,
  FolderTree,
  X,
  AlertCircle,
  Copy,
  Check,
  Filter
} from 'lucide-react';

interface LinkManagementProps {
  links: DanhSachTrangWebRecord[];
  categories: DanhMucRecord[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const LinkManagement: React.FC<LinkManagementProps> = ({
  links,
  categories,
  onRefresh,
  isLoading,
}) => {
  const { isAdmin } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DanhSachTrangWebRecord | null>(null);

  // Form state
  const [formTen, setFormTen] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formMota, setFormMota] = useState('');
  const [formPhanLoai, setFormPhanLoai] = useState<number>(categories[0]?.id || 1);
  const [formHieuLuc, setFormHieuLuc] = useState<boolean>(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Map category ID to category name
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => {
      map.set(c.id, c.phanloai);
    });
    return map;
  }, [categories]);

  // Filtered links by search term (Tên trang web, Link) and dropdown filters
  const filteredLinks = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return links.filter((item) => {
      // Tìm theo Tên trang web hoặc Link
      const matchesSearch =
        !term ||
        item.ten?.toLowerCase().includes(term) ||
        item.link?.toLowerCase().includes(term) ||
        (item.mota && item.mota.toLowerCase().includes(term));

      // Lọc theo Danh mục
      const matchesCat =
        selectedCategory === 'all' || String(item.phanloai) === selectedCategory;

      // Lọc theo Trạng thái Hiệu lực
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && item.hieuluc) ||
        (selectedStatus === 'inactive' && !item.hieuluc);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [links, searchTerm, selectedCategory, selectedStatus]);

  // Copy link helper
  const handleCopy = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredLinks.map((item, index) => ({
      'STT': index + 1,
      'Mã số': item.id,
      'Tên trang Web': item.ten,
      'Đường dẫn liên kết': item.link,
      'Danh mục phân loại': categoryMap.get(item.phanloai) || `Nhóm #${item.phanloai}`,
      'Mô tả công dụng': item.mota || 'Không có mô tả',
      'Hiệu lực': item.hieuluc ? 'Có hiệu lực (Hoạt động)' : 'Đã vô hiệu hóa (Tạm ngừng)',
      'Thời gian xuất': new Date().toLocaleString('vi-VN'),
    }));

    exportToExcel(
      exportData,
      `Danh_Sach_Trang_Web_DAU_${new Date().toISOString().slice(0, 10)}`,
      'DanhSachTrangWeb'
    );
  };

  // Open Add modal
  const handleOpenAdd = () => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) mới có quyền thêm trang web!');
      return;
    }
    setEditingLink(null);
    setFormTen('');
    setFormLink('');
    setFormMota('');
    setFormPhanLoai(categories[0]?.id || 1);
    setFormHieuLuc(true);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: DanhSachTrangWebRecord) => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) mới có quyền hiệu chỉnh trang web!');
      return;
    }
    setEditingLink(item);
    setFormTen(item.ten);
    setFormLink(item.link);
    setFormMota(item.mota || '');
    setFormPhanLoai(item.phanloai);
    setFormHieuLuc(item.hieuluc);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  // Toggle hieuluc (Kích hoạt / Vô hiệu hóa)
  const handleToggleHieuLuc = async (item: DanhSachTrangWebRecord) => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) mới có quyền thay đổi hiệu lực!');
      return;
    }

    const newStatus = !item.hieuluc;
    try {
      const { error } = await supabase
        .from('danhsachtrangweb')
        .update({ hieuluc: newStatus })
        .eq('id', item.id);

      if (error) {
        alert(`Lỗi cập nhật hiệu lực: ${error.message}`);
      } else {
        onRefresh();
      }
    } catch (e: unknown) {
      alert(`Lỗi: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Delete link
  const handleDeleteLink = async (item: DanhSachTrangWebRecord) => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) mới có quyền xóa trang web!');
      return;
    }

    if (!window.confirm(`Xác nhận xóa trang web "${item.ten}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('danhsachtrangweb')
        .delete()
        .eq('id', item.id);

      if (error) {
        alert(`Lỗi khi xóa trang web: ${error.message}`);
      } else {
        onRefresh();
      }
    } catch (e: unknown) {
      alert(`Lỗi: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanTen = formTen.trim();
    let cleanLink = formLink.trim();
    const cleanMota = formMota.trim();

    if (!cleanTen || !cleanLink) {
      setFormError('Vui lòng nhập Tên trang web và Đường dẫn liên kết!');
      return;
    }

    // Auto prepend https:// if missing
    if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = `https://${cleanLink}`;
    }

    setSubmitting(true);
    try {
      if (editingLink) {
        // Cập nhật (Hiệu chỉnh)
        const { error } = await supabase
          .from('danhsachtrangweb')
          .update({
            ten: cleanTen,
            link: cleanLink,
            mota: cleanMota || null,
            phanloai: formPhanLoai,
            hieuluc: formHieuLuc,
          })
          .eq('id', editingLink.id);

        if (error) {
          setFormError(`Lỗi cập nhật: ${error.message}`);
        } else {
          setFormSuccess('Đã cập nhật trang web thành công!');
          setTimeout(() => {
            setIsModalOpen(false);
            onRefresh();
          }, 900);
        }
      } else {
        // Thêm mới
        const { error } = await supabase.from('danhsachtrangweb').insert([
          {
            ten: cleanTen,
            link: cleanLink,
            mota: cleanMota || null,
            phanloai: formPhanLoai,
            hieuluc: formHieuLuc,
          },
        ]);

        if (error) {
          setFormError(`Lỗi thêm mới: ${error.message}`);
        } else {
          setFormSuccess('Đã thêm mới trang web thành công!');
          setTimeout(() => {
            setIsModalOpen(false);
            onRefresh();
          }, 900);
        }
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search by ten & link */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhanh theo Tên trang web, Link liên kết, Mô tả..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tất cả phân loại ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.phanloai}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="relative shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tất cả hiệu lực</option>
                <option value="active">Đang có hiệu lực</option>
                <option value="inactive">Đã vô hiệu hóa</option>
              </select>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Excel
            </button>

            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Thêm mới trang Web
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Tìm thấy <strong className="text-slate-800">{filteredLinks.length}</strong> / {links.length} liên kết
          </span>
          <span className="text-[11px] text-slate-400">
            Bấm "Truy cập" để mở trang web trong Tab mới
          </span>
        </div>
      </div>

      {/* Styled Table conforming to User Instruction:
          "Tiêu đề: Font chữ đỏ, chữ hoa đầu từ. Các dòng số liệu là chữ thường, màu xanh" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50/60 border-b border-red-100">
                <th className="py-3 px-4 text-xs font-bold text-red-600 tracking-wide whitespace-nowrap">
                  Mã số
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 tracking-wide whitespace-nowrap">
                  Tên trang Web
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 tracking-wide whitespace-nowrap">
                  Đường dẫn liên kết
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 tracking-wide whitespace-nowrap">
                  Phân loại danh mục
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 tracking-wide whitespace-nowrap">
                  Mô tả công dụng
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 tracking-wide whitespace-nowrap">
                  Hiệu lực
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 tracking-wide text-right whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-500">Đang tải danh sách trang web từ Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Không tìm thấy trang Web nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((item) => {
                  const categoryName = categoryMap.get(item.phanloai) || `Nhóm #${item.phanloai}`;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.hieuluc ? 'bg-slate-50/40 opacity-80' : ''
                      }`}
                    >
                      {/* Dòng số liệu là chữ thường, màu xanh */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-blue-700 whitespace-nowrap">
                        #{item.id}
                      </td>

                      {/* Tên trang web */}
                      <td className="py-3.5 px-4 text-xs font-medium text-blue-700 whitespace-nowrap max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-blue-900 truncate" title={item.ten}>
                            {item.ten}
                          </span>
                        </div>
                      </td>

                      {/* Link liên kết */}
                      <td className="py-3.5 px-4 text-xs font-normal text-blue-700 max-w-[240px]">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[190px] inline-block font-mono text-[11px]"
                            title={item.link}
                          >
                            {item.link}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.link)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors shrink-0"
                            title="Sao chép link"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phân loại */}
                      <td className="py-3.5 px-4 text-xs font-normal text-blue-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                          <FolderTree className="w-3 h-3 text-blue-500" />
                          {categoryName}
                        </span>
                      </td>

                      {/* Mô tả */}
                      <td className="py-3.5 px-4 text-xs font-normal text-blue-700 max-w-[220px]">
                        <p className="truncate text-[11px]" title={item.mota || 'Chưa có mô tả'}>
                          {item.mota ? item.mota : 'không có mô tả'}
                        </p>
                      </td>

                      {/* Hiệu lực */}
                      <td className="py-3.5 px-4 text-xs font-normal text-blue-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {item.hieuluc ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Có hiệu lực (hoạt động)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              Đã vô hiệu hóa (Tạm ngừng)
                            </span>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleToggleHieuLuc(item)}
                              title={item.hieuluc ? 'Nhấn để vô hiệu hóa' : 'Nhấn để kích hoạt lại'}
                              className="text-[11px] underline text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {item.hieuluc ? 'Tắt' : 'Bật'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Thao tác Quản trị */}
                      <td className="py-3.5 px-4 text-xs text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Nút mở trang web */}
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                            title="Mở trang Web trong Tab mới"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Truy Cập
                          </a>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-xs transition-colors"
                                title="Hiệu chỉnh thông tin trang Web"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLink(item)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs transition-colors"
                                title="Xóa trang Web"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingLink ? 'Hiệu chỉnh Liên kết trang Web' : 'Thêm mới Liên kết trang Web'}
                  </h3>
                  <p className="text-xs text-red-100">Bảng 'danhsachtrangweb' trên Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Tên Trang Web (ten)
                </label>
                <input
                  type="text"
                  required
                  value={formTen}
                  onChange={(e) => setFormTen(e.target.value)}
                  placeholder="ví dụ: SnapTik - Tải Video TikTok Không Logo"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Đường dẫn Liên kết (link)
                </label>
                <input
                  type="text"
                  required
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="ví dụ: https://snaptik.app hoặc https://dau.edu.vn"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Phân loại trang Web
                </label>
                <select
                  value={formPhanLoai}
                  onChange={(e) => setFormPhanLoai(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} - {c.phanloai}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Mô tả chức năng trang Web
                </label>
                <textarea
                  rows={3}
                  value={formMota}
                  onChange={(e) => setFormMota(e.target.value)}
                  placeholder="Mô tả chức năng chính của Website, cách sử dụng, lưu ý..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formHieuLuc"
                  checked={formHieuLuc}
                  onChange={(e) => setFormHieuLuc(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <label htmlFor="formHieuLuc" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Kích hoạt hiệu lực hoạt động ngay (hieuluc = true)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingLink ? 'Lưu thay đổi' : 'Thêm trang Web'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
