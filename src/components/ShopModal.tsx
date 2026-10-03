import React, { useState } from 'react';
import { X, ShoppingBag, Coins, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ShopItem } from '../types';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  const { shopItems, stats, buyShopItem, activeTheme, setActiveTheme } = useGame();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = (item: ShopItem) => {
    setErrorMsg(null);
    if (item.unlocked) {
      if (item.type === 'theme') {
        setActiveTheme(item.id);
      }
    } else {
      const success = buyShopItem(item);
      if (!success) {
        setErrorMsg('Bạn không đủ Xu Arcade để mua vật phẩm này! Hãy chơi thêm minigame nhé.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
                Cửa Hàng Arcade
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dùng xu kiếm được từ game để đổi giao diện và hiệu ứng độc quyền
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

        {/* Current Coins display */}
        <div className="my-4 flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl">
          <span className="text-xs text-amber-200 font-medium">Số dư hiện tại của bạn</span>
          <div className="flex items-center gap-1.5 font-black text-amber-300 text-lg">
            <Coins size={18} className="text-amber-400" />
            <span>{stats.coins.toLocaleString()} Xu</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {shopItems.map((item) => {
            const isEquipped = item.type === 'theme' && activeTheme === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isEquipped
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-900/20'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{item.icon}</span>
                    {item.unlocked ? (
                      isEquipped ? (
                        <span className="text-[11px] bg-emerald-500 text-black font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={12} /> Đang dùng
                        </span>
                      ) : (
                        <span className="text-[11px] bg-slate-700 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                          Đã sở hữu
                        </span>
                      )
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Coins size={12} />
                        <span>{item.price}</span>
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <button
                    onClick={() => handleAction(item)}
                    disabled={isEquipped}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isEquipped
                        ? 'bg-slate-800 text-slate-500 cursor-default'
                        : item.unlocked
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30'
                    }`}
                  >
                    {isEquipped ? (
                      'Đang áp dụng'
                    ) : item.unlocked ? (
                      'Áp dụng ngay'
                    ) : (
                      <>
                        <Sparkles size={13} />
                        Mua với {item.price} Xu
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
          >
            Đóng cửa hàng
          </button>
        </div>
      </div>
    </div>
  );
};
