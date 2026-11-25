import React from 'react';
import { useStore } from '../context/StoreContext';
import { Crown, Phone, MapPin, Clock, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, setIsAdminOpen } = useStore();

  return (
    <footer className="bg-[#08090e] border-t border-amber-500/20 text-gray-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xl font-black font-royal text-white">
                KING <span className="gold-gradient-text">PIZZARIA</span>
              </span>
            </div>
            <p className="text-gray-300 font-medium text-xs">
              "{settings.slogan}"
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Pizzaria artesanal com receitas tradicionais e especiais. Pedidos rápidos enviados diretamente para o WhatsApp.
            </p>
          </div>

          {/* Contact & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-royal">
              Atendimento King
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">WhatsApp: (85) 98528-0354</span>
              </a>
              <a
                href="https://instagram.com/Kiing_pizzaria"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-amber-300 hover:text-amber-200 transition-colors font-semibold"
              >
                <span>Instagram: @Kiing_pizzaria</span>
              </a>
              <div className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </div>
            </div>
          </div>

          {/* Operating Hours & Delivery */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-royal">
              Horários & Entregas
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{settings.openingHours.days}: {settings.openingHours.openTime} às {settings.openingHours.closeTime}</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Até 4 km: <strong className="text-amber-400">R$ 4,00</strong>
              </p>
              <p className="text-[11px] text-gray-300">
                Acima de 4 até 7 km: <strong className="text-amber-400">R$ 6,00</strong>
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold">
                Retirada no Balcão: Sem taxa!
              </p>
            </div>
          </div>

          {/* Payments & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-royal">
              Formas de Pagamento
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded bg-[#141624] border border-gray-800 text-[11px] text-amber-300 font-bold">
                PIX
              </span>
              <span className="px-2.5 py-1 rounded bg-[#141624] border border-gray-800 text-[11px] text-gray-300">
                Dinheiro
              </span>
              <span className="px-2.5 py-1 rounded bg-[#141624] border border-gray-800 text-[11px] text-gray-300">
                Cartão de Crédito
              </span>
              <span className="px-2.5 py-1 rounded bg-[#141624] border border-gray-800 text-[11px] text-gray-300">
                Cartão de Débito
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsAdminOpen(true)}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 flex items-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acesso do Proprietário (Admin)</span>
              </button>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
          <p>© {new Date().getFullYear()} King Pizzaria. Todos os direitos reservados.</p>
          <p className="text-gray-400">
            Cardápio Digital & Pedidos Online • Parangaba, Fortaleza - CE
          </p>
        </div>

      </div>
    </footer>
  );
};
