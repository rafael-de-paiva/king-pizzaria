import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/pricing';
import { X, Trash2, Plus, Minus, ShoppingBag, Bike, Store, ArrowRight } from 'lucide-react';
import { DeliveryType } from '../types';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    settings,
    setIsCheckoutOpen,
  } = useStore();

  const [deliveryTypePreview, setDeliveryTypePreview] = useState<DeliveryType>('delivery');

  if (!isCartOpen) return null;

  const currentDeliveryFee = deliveryTypePreview === 'delivery' ? settings.deliveryFee : 0;
  const grandTotal = cartSubtotal + currentDeliveryFee;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de Compras"
          className="w-screen max-w-md bg-[#0e1017] border-l border-amber-500/20 shadow-2xl flex flex-col justify-between"
        >
          
          {/* Drawer Header */}
          <div className="px-5 py-4 bg-[#141622] border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-black font-royal text-white flex items-center gap-1.5">
                  Seu Carrinho
                </h2>
                <p className="text-[11px] text-gray-400">
                  {cart.length === 0 ? 'Seu carrinho está vazio' : `${cart.length} item(ns) no pedido`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  title="Esvaziar carrinho"
                  className="p-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Limpar</span>
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Fechar carrinho"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Items Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#181a27] border border-gray-800 flex items-center justify-center text-amber-400">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Carrinho Vazio</h3>
                  <p className="text-xs text-gray-400 max-w-xs mt-1">
                    Você ainda não adicionou nenhum item ao seu carrinho. Confira as opções do nosso cardápio.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all"
                >
                  Ver Cardápio
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#141624] border border-gray-800/80 rounded-2xl p-3.5 space-y-2.5 shadow-md"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-800 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remover ${item.name}`}
                          className="text-gray-500 hover:text-red-400 p-0.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Customization Details if Pizza */}
                      {item.customization && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-gray-400">
                          <p>
                            <span className="text-amber-400/90 font-medium">Sabores:</span>{' '}
                            {item.customization.flavors.map((f) => f.name).join(' / ')}
                          </p>

                          {item.customization.crust && item.customization.crust.price > 0 && (
                            <p>
                              <span className="text-amber-400/90 font-medium">Borda:</span>{' '}
                              {item.customization.crust.name} (+{formatCurrency(item.customization.crust.price)})
                            </p>
                          )}

                          {item.customization.extras && item.customization.extras.length > 0 && (
                            <p>
                              <span className="text-amber-400/90 font-medium">Extras:</span>{' '}
                              {item.customization.extras.map((e) => e.name).join(', ')}
                            </p>
                          )}

                          {item.customization.notes && (
                            <p className="italic text-gray-400">
                              Obs: "{item.customization.notes}"
                            </p>
                          )}
                        </div>
                      )}

                      {!item.customization && item.notes && (
                        <p className="text-[11px] italic text-gray-400 mt-1">
                          Obs: "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Price row */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                    <div className="flex items-center gap-1.5 bg-[#1b1e2c] border border-gray-800 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        aria-label="Diminuir"
                        className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-white px-2">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        aria-label="Aumentar"
                        className="w-6 h-6 rounded bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-colors text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block leading-none">
                        {item.quantity}x {formatCurrency(item.unitPrice)}
                      </span>
                      <span className="text-sm font-black text-amber-400">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer Summary & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#141622] border-t border-amber-500/20 space-y-3">
              
              {/* Delivery Type Quick Switch */}
              <div className="bg-[#1b1d2b] p-1 rounded-xl border border-gray-800 grid grid-cols-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryTypePreview('delivery')}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    deliveryTypePreview === 'delivery'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Entrega ({formatCurrency(settings.deliveryFee)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryTypePreview('pickup')}
                  className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    deliveryTypePreview === 'pickup'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Retirada (Grátis)</span>
                </button>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(cartSubtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-400">
                  <span>Taxa de Entrega</span>
                  <span className={currentDeliveryFee === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                    {currentDeliveryFee === 0 ? 'Grátis' : formatCurrency(currentDeliveryFee)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Estimado</span>
                  <span className="text-xl font-black text-amber-400">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm rounded-xl shadow-lg shadow-red-600/35 flex items-center justify-center gap-2 border border-red-500/50 active:scale-98 transition-all"
              >
                <span>Avançar para Finalizar Pedido</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
