import React, { useState } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Calendar,
  HardDrive,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ConfirmationModal } from './ConfirmationModal';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    hasGoogleAuth,
    isLoggingIn,
    driveFile,
    syncStatus,
    lastSyncTime,
    loginGoogle,
    logoutGoogle,
    syncToDrive,
    restoreFromDrive,
    deleteCloudSave,
    refreshDriveStatus,
  } = useGame();

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Destructive confirmations
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setFeedbackMsg(null);
    try {
      await loginGoogle();
      setFeedbackMsg({ type: 'success', text: 'Đăng nhập Google thành công!' });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Đăng nhập Google không thành công.',
      });
    }
  };

  const handleSyncToDrive = async () => {
    setFeedbackMsg(null);
    setIsProcessing(true);
    try {
      await syncToDrive();
      setFeedbackMsg({
        type: 'success',
        text: 'Đã sao lưu toàn bộ kỷ lục và xu thành công lên Google Drive!',
      });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Không thể lưu lên Google Drive.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRestore = async () => {
    setConfirmRestoreOpen(false);
    setFeedbackMsg(null);
    setIsProcessing(true);
    try {
      await restoreFromDrive();
      setFeedbackMsg({
        type: 'success',
        text: 'Khôi phục tiến trình từ Google Drive thành công!',
      });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Không thể tải file từ Google Drive.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false);
    setFeedbackMsg(null);
    setIsProcessing(true);
    try {
      await deleteCloudSave();
      setFeedbackMsg({
        type: 'success',
        text: 'Đã xóa file sao lưu khỏi Google Drive của bạn.',
      });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Không thể xóa file sao lưu.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
                <Cloud size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Đồng Bộ Google Drive
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lưu trữ đám mây an toàn, bảo vệ kỷ lục và xu chơi game của bạn
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Feedback Message */}
          {feedbackMsg && (
            <div
              className={`mt-4 p-3.5 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 size={18} className="shrink-0" />
              ) : (
                <AlertCircle size={18} className="shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Auth Section */}
          <div className="mt-6 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
            {!hasGoogleAuth || !user ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <Cloud size={24} />
                </div>
                <h3 className="font-semibold text-slate-200 mb-1">
                  Đăng nhập tài khoản Google để bắt đầu
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                  Kết nối với Google Drive với quyền riêng tư an toàn, chỉ truy cập tệp do PlayVerse tạo ra.
                </p>

                {/* Official Sign in with Google Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSignIn}
                    disabled={isLoggingIn}
                    className="flex items-center gap-3 bg-white text-slate-800 hover:bg-slate-100 font-semibold px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 active:scale-95 disabled:opacity-50"
                  >
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="w-5 h-5 shrink-0"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    <span>
                      {isLoggingIn ? 'Đang mở cửa sổ đăng nhập...' : 'Đăng nhập với Google'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg text-white">
                      {(user.displayName || user.email || 'P')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {user.displayName || 'Game Master'}
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Đã kết nối
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block truncate max-w-[220px]">
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refreshDriveStatus()}
                    title="Làm mới trạng thái Drive"
                    className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={logoutGoogle}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-medium transition-colors"
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Save File Info */}
          {hasGoogleAuth && (
            <div className="mt-5 bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tệp Sao Lưu Trên Drive
                </span>
                {syncStatus === 'syncing' ? (
                  <span className="text-xs text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Đang truyền dữ liệu...
                  </span>
                ) : driveFile ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    Đã tìm thấy tệp
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Chưa có bản sao lưu</span>
                )}
              </div>

              {driveFile ? (
                <div className="space-y-2 text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson size={16} className="text-amber-400" />
                      <span className="font-mono text-slate-200">{driveFile.name}</span>
                    </div>
                    {driveFile.webViewLink && (
                      <a
                        href={driveFile.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                      >
                        Mở trên Drive <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} />
                      <span>
                        Cập nhật:{' '}
                        {driveFile.modifiedTime
                          ? new Date(driveFile.modifiedTime).toLocaleString('vi-VN')
                          : 'Vừa xong'}
                      </span>
                    </div>
                    {driveFile.size && (
                      <div className="flex items-center gap-1">
                        <HardDrive size={13} />
                        <span>{(parseInt(driveFile.size) / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Bạn chưa có bản sao lưu nào trên Drive. Nhấn &quot;Sao lưu ngay&quot; để tạo bản lưu đầu tiên!
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {hasGoogleAuth && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSyncToDrive}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-cyan-600/25 active:scale-98 transition-all disabled:opacity-50"
              >
                <CloudUpload size={18} />
                <span>Sao Lưu Lên Drive</span>
              </button>

              <button
                onClick={() => setConfirmRestoreOpen(true)}
                disabled={isProcessing || !driveFile}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold rounded-2xl active:scale-98 transition-all disabled:opacity-40"
              >
                <CloudDownload size={18} />
                <span>Khôi Phục Từ Drive</span>
              </button>
            </div>
          )}

          {/* Destructive Zone */}
          {hasGoogleAuth && driveFile && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Thao tác vùng nguy hiểm:</span>
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isProcessing}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                Xóa file sao lưu khỏi Drive
              </button>
            </div>
          )}

          {/* Footer Close */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs for destructive actions */}
      <ConfirmationModal
        isOpen={confirmRestoreOpen}
        title="Khôi Phục Tiến Trình Từ Google Drive?"
        message="Hành động này sẽ ghi đè dữ liệu điểm cao, xu, và thành tựu hiện tại trên trình duyệt này bằng bản sao lưu mới nhất trên Google Drive của bạn."
        confirmLabel="Khôi Phục Ngay"
        cancelLabel="Hủy Bỏ"
        isDestructive={false}
        isLoading={isProcessing}
        onConfirm={handleConfirmRestore}
        onCancel={() => setConfirmRestoreOpen(false)}
      />

      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        title="Xóa Bản Sao Lưu Khỏi Google Drive?"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn tệp 'playverse_save_data.json' trên Google Drive? Dữ liệu đã xóa sẽ không thể phục hồi từ đám mây."
        confirmLabel="Xác Nhận Xóa"
        cancelLabel="Giữ Lại Tệp"
        isDestructive={true}
        isLoading={isProcessing}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
};
