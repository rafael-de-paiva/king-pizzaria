import React, { useState, useMemo } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CombosSection } from './components/CombosSection';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { PizzaCustomizerModal } from './components/PizzaCustomizerModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminPanel } from './components/AdminPanel';
import { FlyerModal } from './components/FlyerModal';
import { Footer } from './components/Footer';
import { formatCurrency } from './utils/pricing';
import { Crown, ShoppingBag, ArrowRight } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    products,
    categories,
    activeCategory,
    cart,
    cartTotalCount,
    cartSubtotal,
    setIsCartOpen,
    openCustomizer,
    isFlyerOpen,
    setIsFlyerOpen,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');

  const displayedProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          categories.find(c => c.id === product.category)?.name.toLowerCase().includes(q) ||
          product.ingredients.some((i) => i.toLowerCase().includes(q))
        );
      }
      return product.category === activeCategory;
    });
  }, [products, categories, activeCategory, searchQuery]);

  const currentCategoryInfo = categories.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f3f4f6] flex flex-col selection:bg-amber-500 selection:text-black">
      <Header />
      <HeroBanner />
      <CombosSection />
      <CategoryNav searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCategoryInfo?.icon || '🍕'}</span>
              <h2 className="text-xl sm:text-3xl font-black font-royal text-white">
                {searchQuery ? `Resultados para "${searchQuery}"` : currentCategoryInfo?.name || 'Cardápio'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {searchQuery
                ? `${displayedProducts.length} produto(s) encontrado(s)`
                : currentCategoryInfo?.description || 'Escolha seu sabor favorito preparado na hora.'}
            </p>
          </div>

          {(!searchQuery && activeCategory.startsWith('pizzas-')) && (
            <button
              onClick={() => openCustomizer()}
              className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <Crown className="w-4 h-4 text-black" />
              <span>Montar Pizza Meio a Meio</span>
            </button>
          )}
        </div>

        {/* Products Grid */}
        {displayedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-4xl">🍕</div>
            <h3 className="text-lg font-bold text-white">Nenhum produto encontrado</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Não encontramos nenhum item correspondente a "{searchQuery}". Tente buscar por outro termo ou escolha uma das categorias acima.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar for Mobile Users */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 inset-x-3 z-30 sm:hidden">
          <div className="bg-[#12141f]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl shadow-black/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white relative shadow-md">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-black font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartTotalCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-semibold">Total no Carrinho</span>
                <span className="text-base font-black text-amber-400 leading-none">
                  {formatCurrency(cartSubtotal)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>Ver Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <PizzaCustomizerModal />
      <CartDrawer />
      <CheckoutModal />
      <AdminPanel />
      <FlyerModal isOpen={isFlyerOpen} onClose={() => setIsFlyerOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
}
