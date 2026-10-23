import React, { useState, useMemo } from 'react';
import { supabase, UserRecord } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { exportToExcel } from '../lib/excelExport';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
  Search,
  FileSpreadsheet,
  UserPlus,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  AlertCircle,
  X,
  Lock
} from 'lucide-react';

interface UserManagementProps {
  users: UserRecord[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onRefresh, isLoading }) => {
  const { currentUser, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<number, boolean>>({});

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<{ id: number; username: string } | null>(null);

  // Form state for creating new user
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEnable, setNewEnable] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filtered users by UserName or Email
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Export Excel
  const handleExportExcel = () => {
    const exportData = filteredUsers.map((u, index) => ({
      'STT': index + 1,
      'Mã Định Danh': u.id ?? 'N/A',
      'Tên Đăng Nhập': u.username,
      'Địa Chỉ Email': u.email,
      'Mật Khẩu': isAdmin ? (u.password || '******') : '******',
      'Hiệu Lực': u.enable ? 'Đang hoạt động (Enable)' : 'Vô hiệu hóa (Disabled)',
      'Quyền Hạn': u.username?.toLowerCase() === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng thường',
      'Thời Gian Xuất': new Date().toLocaleString('vi-VN'),
    }));

    exportToExcel(exportData, `Danh_Sach_Nguoi_Dung_DAU_${new Date().toISOString().slice(0, 10)}`, 'NguoiDung');
  };

  // Toggle user enable status
  const handleToggleEnable = async (targetUser: UserRecord) => {
    if (!isAdmin) {
      alert('Bạn không có quyền thay đổi hiệu lực tài khoản! Chỉ Quản trị viên (Admin) mới có quyền này.');
      return;
    }

    if (targetUser.username?.toLowerCase() === 'admin' && targetUser.enable) {
      alert('Không thể vô hiệu hóa tài khoản Quản trị viên chính (Admin)!');
      return;
    }

    const newStatus = !targetUser.enable;
    const confirmMsg = `Bạn có chắc chắn muốn ${newStatus ? 'KÍCH HOẠT' : 'VÔ HIỆU HÓA'} tài khoản "${targetUser.username}" không?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('user')
        .update({ enable: newStatus })
        .eq('id', targetUser.id);

      if (error) {
        alert(`Lỗi khi cập nhật hiệu lực: ${error.message}`);
      } else {
        onRefresh();
      }
    } catch (e: unknown) {
      alert(`Lỗi hệ thống: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Delete user
  const handleDeleteUser = async (targetUser: UserRecord) => {
    if (!isAdmin) {
      alert('Bạn không có quyền xóa tài khoản! Chỉ Quản trị viên (Admin) mới có quyền này.');
      return;
    }

    if (targetUser.username?.toLowerCase() === 'admin' || targetUser.email?.toLowerCase() === 'tcns@dau.edu.vn') {
      alert('Không thể xóa tài khoản Quản trị viên gốc hệ thống!');
      return;
    }

    if (targetUser.id === currentUser?.id) {
      alert('Bạn không thể xóa tài khoản hiện đang đăng nhập của chính mình!');
      return;
    }

    if (!window.confirm(`Xác nhận xóa vĩnh viễn tài khoản "${targetUser.username}" (${targetUser.email}) khỏi hệ thống?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user')
        .delete()
        .eq('id', targetUser.id);

      if (error) {
        alert(`Lỗi khi xóa tài khoản: ${error.message}`);
      } else {
        onRefresh();
      }
    } catch (e: unknown) {
      alert(`Lỗi hệ thống: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Create new user submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!isAdmin) {
      setFormError('Chỉ Quản trị viên (Admin) mới có quyền tạo mới tài khoản người dùng!');
      return;
    }

    const cleanUsername = newUsername.trim();
    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanPassword = newPassword.trim();

    if (!cleanUsername || !cleanEmail || !cleanPassword) {
      setFormError('Vui lòng điền đầy đủ Tên đăng nhập, Email và Mật khẩu!');
      return;
    }

    // Kiểm tra trùng username hoặc email
    const exists = users.some(
      (u) =>
        u.username?.toLowerCase() === cleanUsername.toLowerCase() ||
        u.email?.toLowerCase() === cleanEmail
    );
    if (exists) {
      setFormError('Tên đăng nhập hoặc Email này đã tồn tại trong hệ thống!');
      return;
    }

    setFormSubmitting(true);
    try {
      const { error } = await supabase.from('user').insert([
        {
          username: cleanUsername,
          email: cleanEmail,
          password: cleanPassword,
          enable: newEnable,
        },
      ]);

      if (error) {
        setFormError(`Lỗi lưu vào Supabase: ${error.message}`);
      } else {
        setFormSuccess(`Đã tạo mới thành công tài khoản "${cleanUsername}"!`);
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setNewUsername('');
          setNewEmail('');
          setNewPassword('');
          setNewEnable(true);
          setFormSuccess('');
          onRefresh();
        }, 1200);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi không xác định xảy ra');
    } finally {
      setFormSubmitting(false);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Role Notification */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isAdmin ? 'bg-red-50/70 border-red-200' : 'bg-amber-50/80 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isAdmin ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'}`}>
            {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isAdmin ? 'text-red-900' : 'text-amber-900'}`}>
              {isAdmin ? 'Quyền Quản Trị Hệ Thống (Admin Toàn Quyền)' : 'Chế Độ Người Dùng (Chỉ Xem)'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isAdmin
                ? 'Bạn có toàn quyền: Tạo mới tài khoản, Thay đổi Password, Thay đổi hiệu lực và Xóa tài khoản người dùng.'
                : 'Bạn đang đăng nhập bằng tài khoản người dùng thường hoặc ở chế độ xem. Không có quyền sửa đổi tài khoản.'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Tạo Mới Tài Khoản
          </button>
        )}
      </div>

      {/* Action Bar: Search & Export Excel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Quick Search */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo UserName, Email..."
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

        {/* Excel Export & Stats */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị: <strong className="text-slate-800">{filteredUsers.length}</strong> / {users.length} tài khoản
          </span>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Xuất Excel (.xlsx)
          </button>
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
                  Mã số
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide whitespace-nowrap">
                  Tên Đăng nhập
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide whitespace-nowrap">
                  Địa chỉ Email
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide whitespace-nowrap">
                  Mật khẩu Quản trị
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide whitespace-nowrap">
                  Hiệu lực sử dụng
                </th>
                <th className="py-3 px-4 text-xs font-bold text-red-600 capitalize tracking-wide text-right whitespace-nowrap">
                  Thao tác Quản trị
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-500">Đang tải dữ liệu từ Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    Không tìm thấy tài khoản người dùng phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserAdmin = u.username?.toLowerCase() === 'admin';
                  const isVisible = Boolean(showPasswordMap[u.id || 0]);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Dòng số liệu là chữ thường, màu xanh (text-blue-700) */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-blue-700 lowercase whitespace-nowrap">
                        #{u.id}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-blue-700 lowercase whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{u.username.toLowerCase()}</span>
                          {isUserAdmin && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-normal text-blue-700 lowercase whitespace-nowrap">
                        {u.email.toLowerCase()}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-blue-700 lowercase whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <span>{isVisible ? u.password : '••••••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id || 0)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                              title={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">•••••••••••• (ẩn)</span>
                        )}
                      </td>

                      {/* Hiệu Lực: Dòng số liệu chữ thường, màu xanh */}
                      <td className="py-3.5 px-4 text-xs font-normal text-blue-700 lowercase whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {u.enable ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              có hiệu lực (enable)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              vô hiệu hóa (disable)
                            </span>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleToggleEnable(u)}
                              title={u.enable ? 'Nhấn để vô hiệu hóa' : 'Nhấn để kích hoạt lại'}
                              className="text-[11px] underline text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {u.enable ? 'khóa' : 'mở'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Thao tác Quản trị */}
                      <td className="py-3.5 px-4 text-xs text-right whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPasswordTarget({ id: u.id!, username: u.username })}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              title="Thay đổi mật khẩu tài khoản này"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              Đổi Mật Khẩu
                            </button>

                            {!isUserAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs transition-colors"
                                title="Xóa tài khoản này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

      {/* Create New User Modal (Admin only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Tạo Mới Tài Khoản Người Dùng</h3>
                  <p className="text-xs text-red-100">Lưu trực tiếp vào Table 'user' trên Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
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
                  Tên Đăng Nhập (UserName)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="ví dụ: gv_nguyenvana"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Địa Chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ví dụ: tcns@dau.edu.vn"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  Mật Khẩu Ban Đầu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu an toàn..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newEnable"
                  checked={newEnable}
                  onChange={(e) => setNewEnable(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <label htmlFor="newEnable" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Kích hoạt hiệu lực sử dụng ngay (Enable = true)
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting ? 'Đang lưu...' : 'Thêm Người Dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal for specific target */}
      {passwordTarget && (
        <ChangePasswordModal
          isOpen={true}
          onClose={() => setPasswordTarget(null)}
          targetUserId={passwordTarget.id}
          targetUsername={passwordTarget.username}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
