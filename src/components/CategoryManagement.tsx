import React, { useState, useMemo } from 'react';
import { supabase, DanhMucRecord, DanhSachTrangWebRecord } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../lib/excelExport';
import {
  Search,
  FileSpreadsheet,
  Plus,
  FolderTree,
  Edit3,
  Trash2,
  FolderPlus,
  X,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface CategoryManagementProps {
  categories: DanhMucRecord[];
  links: DanhSachTrangWebRecord[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  links,
  onRefresh,
  isLoading,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DanhMucRecord | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calculate website count per category
  const countPerCategory = useMemo(() => {
    const map: Record<number, number> = {};
    links.forEach((l) => {
      map[l.phanloai] = (map[l.phanloai] || 0) + 1;
    });
    return map;
  }, [links]);

  // Search by 'phanloai'
  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return categories;
    return categories.filter((c) =>
      c.phanloai?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredCategories.map((c, index) => ({
      'STT': index + 1,
      'Mã Phân loại (ID)': c.id,
      'Tên Danh mục phân loại': c.phanloai,
      'Số trang Web đang thuộc danh mục': countPerCategory[c.id] || 0,
      'Ngày xuất': new Date().toLocaleString('vi-VN'),
    }));

    exportToExcel(
      exportData,
      `Danh_Muc_Phan_Loai_Trang_Web_${new Date().toISOString().slice(0, 10)}`,
      'DanhMucWeb'
    );
  };

  const handleOpenAddModal = () => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) mới có quyền thêm danh mục phân loại!');
      return;
    }
    setEditingCategory(null);
    setCategoryName('');
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: DanhMucRecord) => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) mới có quyền hiệu chỉnh danh mục!');
      return;
    }
    setEditingCategory(cat);
    setCategoryName(cat.phanloai);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (cat: DanhMucRecord) => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên (Admin) mới có quyền xóa danh mục!');
      return;
    }

    const linkedCount = countPerCategory[cat.id] || 0;
    if (linkedCount > 0) {
      const proceed = window.confirm(
        `CẢNH BÁO: Hiện đang có ${linkedCount} liên kết trang web thuộc phân loại "${cat.phanloai}".\nNếu xóa danh mục này, các trang web liên quan có thể bị lỗi liên kết. Bạn có chắc chắn muốn xóa không?`
      );
      if (!proceed) return;
    } else {
      if (!window.confirm(`Xác nhận xóa danh mục phân loại "${cat.phanloai}"?`)) {
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('danhmucweb')
        .delete()
        .eq('id', cat.id);

      if (error) {
        alert(`Lỗi khi xóa danh mục: ${error.message}`);
      } else {
        onRefresh();
      }
    } catch (e: unknown) {
      alert(`Lỗi: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanName = categoryName.trim();
    if (!cleanName) {
      setFormError('Vui lòng nhập tên danh mục phân loại!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Cập nhật (Hiệu chỉnh)
        const { error } = await supabase
          .from('danhmucweb')
          .update({ phanloai: cleanName })
          .eq('id', editingCategory.id);

        if (error) {
          setFormError(`Lỗi cập nhật: ${error.message}`);
        } else {
          setFormSuccess('Đã cập nhật danh mục thành công!');
          setTimeout(() => {
            setIsModalOpen(false);
            onRefresh();
          }, 900);
        }
      } else {
        // Thêm mới
        const { error } = await supabase
          .from('danhmucweb')
          .insert([{ phanloai: cleanName }]);

        if (error) {
          setFormError(`Lỗi thêm mới: ${error.message}`);
        } else {
          setFormSuccess('Đã thêm mới danh mục thành công!');
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
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search by phanloai */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên phân loại..."
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

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm mới Phân loại
            </button>
          )}
        </div>
      </div>

      {/* Styled Table conforming to User Instruction:
          "Tiêu đề: Font chữ đỏ, chữ hoa đầu từ. Các dòng số liệu là chữ thường, màu xanh" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50/60 border-b border-red-100">
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide whitespace-nowrap">
                  Mã Phân loại
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide whitespace-nowrap">
                  Tên Phân loại trang Web
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide whitespace-nowrap">
                  Số lượng liên kết trực thuộc
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide text-right whitespace-nowrap">
                  Thao tác Quản trị
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-500">Đang tải danh mục từ Database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 text-xs">
                    Không tìm thấy danh mục phân loại phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const linkedCount = countPerCategory[c.id] || 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Dòng số liệu là chữ thường, màu xanh */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-blue-700 whitespace-nowrap">
                        #{c.id}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-blue-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-semibold text-blue-800">{c.phanloai}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-normal text-blue-700 lowercase whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                          {linkedCount} Liên kết
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-right whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              title="Hiệu chỉnh phân loại này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Hiệu Chỉnh
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs transition-colors"
                              title="Xóa danh mục này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chỉ xem</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FolderPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingCategory ? 'Hiệu chỉnh Danh mục Phân loại' : 'Thêm mới Danh mục Phân loại'}
                  </h3>
                  <p className="text-xs text-red-100">Bảng 'danhmucweb' trên Database</p>
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
                  Tên Phân Loại (phanloai)
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="ví dụ: Công cụ chuyển đổi File, Đồ họa & Thiết kế..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
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
                  {submitting ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
