import React from 'react';
import { Crown, ShoppingBag, ShieldCheck, Clock, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/pricing';

export const Header: React.FC = () => {
  const {
    settings,
    isOpen,
    statusText,
    cartTotalCount,
    cartSubtotal,
    setIsCartOpen,
    setIsAdminOpen,
    setIsFlyerOpen,
  } = useStore();

  return (
    <header className="sticky top-0 z-40 bg-[#0c0d14]/95 backdrop-blur-md border-b border-amber-500/20 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-0.5 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/30">
              <div className="w-full h-full bg-[#12131a] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <Crown className="w-6 h-6 text-amber-400 drop-shadow-md" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold tracking-wide font-royal text-white flex items-center gap-1">
                  KING <span className="gold-gradient-text">PIZZARIA</span>
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-bold tracking-wider hidden sm:block">
                Master - Chefe W.N • {settings.slogan}
              </p>
            </div>
          </div>

          {/* Center Info: Status & Delivery Fee (Hidden on very small screens) */}
          <div className="hidden md:flex items-center gap-4 bg-[#161822] px-4 py-2 rounded-full border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isOpen ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                )}
              </span>
              <span className={isOpen ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </span>
              <span className="text-gray-400 text-[11px]">({statusText})</span>
            </div>

            <div className="h-3 w-px bg-gray-700" />

            <div className="flex items-center gap-1 text-amber-300/90">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{settings.estimatedDeliveryTime}</span>
            </div>

            <div className="h-3 w-px bg-gray-700" />

            <div className="flex items-center gap-1 text-gray-300 font-medium">
              <span>Taxa Fixa:</span>
              <span className="text-amber-400 font-bold">{formatCurrency(settings.deliveryFee)}</span>
            </div>
          </div>

          {/* Right Action: Flyer, Admin Access & Cart */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* View printed flyer button */}
            <button
              onClick={() => setIsFlyerOpen(true)}
              aria-label="Ver panfleto do cardápio oficial"
              title="Ver Panfleto Oficial Impresso"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white bg-[#1a1c29] hover:bg-[#222538] border border-gray-700/80 rounded-xl transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Panfleto</span>
            </button>

            {/* Admin button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              aria-label="Acessar painel administrativo"
              title="Painel Administrativo do Proprietário"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300/90 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={`Carrinho com ${cartTotalCount} itens`}
              className="relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all transform active:scale-95 border border-red-500/50"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-white" />
                {cartTotalCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-black font-extrabold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-[#0c0d14] shadow-md">
                    {cartTotalCount}
                  </span>
                )}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] text-red-200 uppercase tracking-wider leading-none">
                  {cartTotalCount === 0 ? 'Carrinho' : `${cartTotalCount} ${cartTotalCount === 1 ? 'item' : 'itens'}`}
                </span>
                <span className="text-sm font-extrabold text-white leading-tight">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
