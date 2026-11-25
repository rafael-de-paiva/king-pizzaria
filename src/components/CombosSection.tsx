import React from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/pricing';
import { Crown, Sparkles, Plus, Check } from 'lucide-react';

export const CombosSection: React.FC = () => {
  const { products, addToCart, setIsCartOpen } = useStore();
  const [addedComboId, setAddedComboId] = React.useState<string | null>(null);

  const combos = products.filter((p) => p.category === 'combos' && p.available);

  if (combos.length === 0) return null;

  const handleAddCombo = (combo: typeof combos[0]) => {
    addToCart({
      id: `combo_cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: combo.id,
      name: combo.name,
      image: combo.image,
      unitPrice: combo.price,
      quantity: 1,
      totalPrice: combo.price,
      notes: 'Combo Promocional da Corte',
    });

    setAddedComboId(combo.id);
    setTimeout(() => {
      setAddedComboId(null);
      setIsCartOpen(true);
    }, 600);
  };

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-[#0c0d15] to-[#12131d] border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ofertas da Casa</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black font-royal text-white">
            Combos Promocionais <span className="gold-gradient-text">Exclusivos</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300">
            Pizzas artesanais, bordas recheadas e refrigerantes gelados com o melhor custo-benefício para a sua família.
          </p>
        </div>

        {/* Combos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="relative rounded-3xl bg-[#161826] border border-amber-500/30 overflow-hidden shadow-xl flex flex-col justify-between group hover:border-amber-400/80 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                <img
                  src={combo.image}
                  alt={combo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161826] via-transparent to-transparent" />

                {combo.badge && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs px-3 py-1 rounded-xl shadow-lg border border-red-400/40 uppercase tracking-wider">
                    {combo.badge}
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-black font-royal text-white group-hover:text-amber-300 transition-colors">
                    {combo.name}
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {combo.description}
                  </p>

                  {/* Highlights list */}
                  {combo.ingredients && combo.ingredients.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {combo.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-amber-300/90 font-medium">
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-semibold">Valor do Combo</span>
                    <span className="text-2xl font-black text-amber-400 font-royal">
                      {formatCurrency(combo.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddCombo(combo)}
                    className={`px-4 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      addedComboId === combo.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-600/30'
                    }`}
                  >
                    {addedComboId === combo.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Adicionado!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Pedir Combo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
