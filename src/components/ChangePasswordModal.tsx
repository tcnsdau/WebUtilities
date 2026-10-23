import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Check, X, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: number;
  targetUsername?: string;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUsername,
  onSuccess,
}) => {
  const { currentUser, isAdmin, updateCurrentPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const isSelf = !targetUserId || targetUserId === currentUser?.id;
  const usernameToDisplay = targetUsername || currentUser?.username || 'Người dùng';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      if (isSelf) {
        const res = await updateCurrentPassword(newPassword);
        if (res.success) {
          setSuccess('Đổi mật khẩu thành công!');
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 1200);
        } else {
          setError(res.message);
        }
      } else {
        // Admin đổi mật khẩu cho người dùng khác
        if (!isAdmin) {
          setError('Chỉ Admin mới có quyền đổi mật khẩu cho tài khoản khác!');
          setLoading(false);
          return;
        }

        const { error: updateErr } = await supabase
          .from('user')
          .update({ password: newPassword })
          .eq('id', targetUserId);

        if (updateErr) {
          setError(`Lỗi cập nhật: ${updateErr.message}`);
        } else {
          setSuccess(`Đã thay đổi mật khẩu thành công cho tài khoản "${usernameToDisplay}"!`);
          setTimeout(() => {
            onClose();
            if (onSuccess) onSuccess();
          }, 1200);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Đổi Mật Khẩu Tài Khoản</h3>
              <p className="text-xs text-red-100">Áp dụng cho: {usernameToDisplay}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Mật Khẩu Mới
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Xác nhận Mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
