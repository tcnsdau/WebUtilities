import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserRecord } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserRecord | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  updateCurrentPassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khôi phục phiên đăng nhập từ localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('dau_supabase_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      }
    } catch (e) {
      console.error('Lỗi khôi phục phiên đăng nhập:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isAdmin = Boolean(
    currentUser &&
      (currentUser.username?.toLowerCase() === 'admin' ||
        currentUser.email?.toLowerCase() === 'tcns@dau.edu.vn' ||
        currentUser.username?.toLowerCase().includes('admin'))
  );

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      const cleanInput = usernameOrEmail.trim();
      const cleanPass = password.trim();

      // Tra cứu từ table 'user' trong Supabase
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .or(`username.ilike.${cleanInput},email.ilike.${cleanInput}`)
        .limit(1);

      if (error) {
        return { success: false, message: `Lỗi kết nối CSDL: ${error.message}` };
      }

      if (!data || data.length === 0) {
        return { success: false, message: 'Không tìm thấy tài khoản với Tên đăng nhập hoặc Email này!' };
      }

      const user = data[0] as UserRecord;

      // Kiểm tra mật khẩu
      if (user.password !== cleanPass) {
        return { success: false, message: 'Mật khẩu không chính xác! Vui lòng thử lại.' };
      }

      // Kiểm tra hiệu lực tài khoản
      if (!user.enable) {
        return {
          success: false,
          message: 'Tài khoản này hiện đang bị VÔ HIỆU HÓA. Vui lòng liên hệ Admin (tcns@dau.edu.vn) để kích hoạt lại!',
        };
      }

      // Đăng nhập thành công
      setCurrentUser(user);
      localStorage.setItem('dau_supabase_current_user', JSON.stringify(user));

      return {
        success: true,
        message: `Đăng nhập thành công! Chào mừng ${user.username} (${user.username.toLowerCase() === 'admin' ? 'Quyền Quản trị viên Toàn quyền' : 'Quyền Người dùng xem nội dung'}).`,
      };
    } catch (err: unknown) {
      return { success: false, message: `Có lỗi xảy ra: ${err instanceof Error ? err.message : String(err)}` };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dau_supabase_current_user');
  };

  const refreshUsers = async () => {
    if (!currentUser) return;
    try {
      const { data } = await supabase
        .from('user')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (data) {
        setCurrentUser(data);
        localStorage.setItem('dau_supabase_current_user', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Lỗi làm mới thông tin tài khoản:', e);
    }
  };

  const updateCurrentPassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser?.id) {
      return { success: false, message: 'Bạn chưa đăng nhập.' };
    }
    try {
      const { error } = await supabase
        .from('user')
        .update({ password: newPassword })
        .eq('id', currentUser.id);

      if (error) {
        return { success: false, message: `Không thể cập nhật mật khẩu: ${error.message}` };
      }

      const updated = { ...currentUser, password: newPassword };
      setCurrentUser(updated);
      localStorage.setItem('dau_supabase_current_user', JSON.stringify(updated));

      return { success: true, message: 'Đổi mật khẩu thành công!' };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Lỗi không xác định' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isLoading,
        login,
        logout,
        refreshUsers,
        updateCurrentPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
