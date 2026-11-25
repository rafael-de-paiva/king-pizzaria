import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/pricing';
import { Plus, Crown, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openCustomizer, addToCart } = useStore();
  const [justAdded, setJustAdded] = React.useState(false);

  const handleAction = () => {
    if (product.isPizza || product.category.startsWith('pizzas-')) {
      openCustomizer(product);
    } else {
      // Direct add to cart for beverages, crusts, combos
      addToCart({
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        image: product.image,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: product.price,
      });

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    }
  };

  const isPizza = product.isPizza || product.category.startsWith('pizzas-');

  return (
    <div className={`group relative bg-[#13141f] rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
      product.available 
        ? 'border-gray-800/80 hover:border-amber-500/40 hover:shadow-amber-500/10 hover:-translate-y-1' 
        : 'border-gray-800 opacity-60'
    }`}>
      
      {/* Top Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1a1c27]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#13141f] via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {product.badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md">
              <Crown className="w-3 h-3 text-black" />
              {product.badge}
            </span>
          )}

          {!product.available && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-rose-600/90 text-white">
              Esgotado Hoje
            </span>
          )}
        </div>

        {/* Price tag on image for quick visibility */}
        <div className="absolute bottom-2.5 right-2.5 bg-[#0c0d14]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30">
          <span className="text-xs text-amber-300 font-extrabold">
            {isPizza ? `A partir de ${formatCurrency(product.price * 0.65)}` : formatCurrency(product.price)}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              {product.name}
            </h3>
          </div>

          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Ingredients pills if present */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {product.ingredients.slice(0, 4).map((ing, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-[#1a1c29] text-gray-400 px-2 py-0.5 rounded-md border border-gray-800"
                >
                  {ing}
                </span>
              ))}
              {product.ingredients.length > 4 && (
                <span className="text-[10px] text-amber-400/80 px-1 py-0.5">
                  +{product.ingredients.length - 4} mais
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Price & CTA Button */}
        <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-gray-400 block leading-none">
              {isPizza ? 'Tam. Grande (8 fatias)' : 'Preço'}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-400">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            onClick={handleAction}
            disabled={!product.available}
            aria-label={isPizza ? `Personalizar ${product.name}` : `Adicionar ${product.name} ao carrinho`}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md ${
              !product.available
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : isPizza
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-600/30 active:scale-95'
                : 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-amber-500/20 active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Adicionado!</span>
              </>
            ) : isPizza ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Montar Pizza</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
