import React from 'react';
import { Crown, Sparkles, Flame, Clock, Bike, ShieldCheck, FileText } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/pricing';

export const HeroBanner: React.FC = () => {
  const { settings, isOpen, statusText, openCustomizer, setIsFlyerOpen } = useStore();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#12131b] via-[#0d0e15] to-[#0b0c10] border-b border-amber-500/20 py-10 sm:py-16">
      {/* Background ambient royal glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-5">
            
            {/* Status & Royal Tag */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 bg-[#161822]/90 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs shadow-inner">
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                King Pizzaria Master • Chefe W.N
              </span>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className={isOpen ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {isOpen ? 'Aberto Hoje' : 'Fechado Agora'}
                </span>
                <span className="text-gray-400 text-[11px]">({statusText})</span>
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-royal text-white tracking-tight leading-[1.1]">
              Sabor de verdade <br />
              <span className="gold-gradient-text drop-shadow-sm">em cada fatia!</span>
            </h1>

            {/* Promo banner callout */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-amber-950/70 border border-red-500/50 flex flex-col sm:flex-row items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 font-black text-[11px] shadow-lg">
                OFERTA
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">
                  PROMOÇÃO PIZZAS TRADICIONAIS: <span className="text-amber-300 font-black text-sm">R$ 43,99</span>
                </p>
                <p className="text-[11px] text-gray-300">
                  Pizza Grande + Borda de Requeijão + Guaraná ou Pepsi 1L (+ Entrega Inclusa)!
                </p>
              </div>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1 text-xs text-gray-300">
              <div className="flex items-center gap-1.5 bg-[#171923] border border-gray-800 px-3 py-1.5 rounded-lg">
                <Bike className="w-4 h-4 text-amber-400" />
                <span>Entregas: <strong className="text-amber-400">Até 4km R$ 4 | Até 7km R$ 6</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#171923] border border-gray-800 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Preparo: <strong className="text-gray-200">{settings.estimatedDeliveryTime}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#171923] border border-gray-800 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Balcão: <strong className="text-emerald-400">Retirada Grátis</strong></span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => openCustomizer()}
                aria-label="Montar Pizza Personalizada"
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-base rounded-xl shadow-xl shadow-red-600/35 hover:shadow-red-600/50 transition-all flex items-center justify-center gap-2.5 border border-red-400/40 transform active:scale-98"
              >
                <Crown className="w-5 h-5 text-amber-300" />
                <span>Fazer Pedido / Montar Pizza</span>
              </button>

              <button
                onClick={() => setIsFlyerOpen(true)}
                aria-label="Ver Panfleto do Cardápio"
                className="w-full sm:w-auto px-5 py-3.5 bg-[#161822] hover:bg-[#1d202c] text-amber-300 font-bold text-xs sm:text-sm rounded-xl border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Ver Panfleto Impresso</span>
              </button>
            </div>

          </div>

          {/* Right Hero Image Showcase */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden p-2 bg-gradient-to-br from-amber-500/30 via-red-600/20 to-transparent border border-amber-500/30 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=85"
                alt="Pizza Real King Pizzaria artesanal saindo do forno"
                className="w-full h-full object-cover rounded-2xl transform hover:scale-105 transition-transform duration-500"
              />

              {/* Floating Badge 1: Sabor Campeão */}
              <div className="absolute top-5 left-5 bg-[#0c0d14]/90 backdrop-blur-md border border-amber-500/40 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Forno Aquecido</p>
                  <p className="text-xs font-bold text-white">Massa Crocante & Macia</p>
                </div>
              </div>

              {/* Floating Badge 2: Coroa */}
              <div className="absolute bottom-5 right-5 bg-gradient-to-r from-red-600 to-red-700 border border-red-400/50 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 text-white">
                <Crown className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-extrabold tracking-wide uppercase">Qualidade Real</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
