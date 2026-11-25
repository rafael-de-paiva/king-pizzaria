import React from 'react';
import { X, Download, Crown } from 'lucide-react';

interface FlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlyerModal: React.FC<FlyerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const flyerSrc = '/images/cardapio-oficial.jpeg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Cardápio Oficial Impresso King Pizzaria"
        className="relative max-w-4xl w-full bg-[#12131d] border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[96vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#171926] border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-royal">
                Panfleto Oficial • King Pizzaria Master
              </h3>
              <p className="text-[11px] text-amber-300/80">
                Chefe W.N • Sabor de verdade em cada fatia!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={flyerSrc}
              target="_blank"
              rel="noopener noreferrer"
              download="Cardapio_King_Pizzaria.jpeg"
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar Imagem</span>
            </a>
            <button
              onClick={onClose}
              aria-label="Fechar panfleto"
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Scrollable View */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 bg-black/60 flex items-center justify-center">
          <img
            src={flyerSrc}
            alt="Cardápio Oficial Impresso King Pizzaria"
            className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-gray-800"
          />
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-[#171926] border-t border-gray-800 text-center text-xs text-gray-400">
          <span>Rua Julio Verne, 270 - Parangaba • WhatsApp: <strong>(85) 98528-0354</strong> • Instagram: <strong>@Kiing_pizzaria</strong></span>
        </div>
      </div>
    </div>
  );
};
