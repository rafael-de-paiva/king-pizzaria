import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { PizzaCrust, PizzaExtra, PizzaFlavor, PizzaSize } from '../types';
import { calculatePizzaPrice, formatCurrency } from '../utils/pricing';
import { Crown, X, Check, AlertCircle, Sparkles } from 'lucide-react';

export const PizzaCustomizerModal: React.FC = () => {
  const {
    isCustomizerOpen,
    closeCustomizer,
    customizingProduct,
    sizes,
    flavors,
    crusts,
    extras,
    settings,
    addToCart,
  } = useStore();

  // Form states
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null);
  const [isHalfAndHalf, setIsHalfAndHalf] = useState<boolean>(false);
  const [selectedFlavor1, setSelectedFlavor1] = useState<PizzaFlavor | null>(null);
  const [selectedFlavor2, setSelectedFlavor2] = useState<PizzaFlavor | null>(null);
  const [selectedCrust, setSelectedCrust] = useState<PizzaCrust | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<PizzaExtra[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [flavorFilter, setFlavorFilter] = useState<'todos' | 'tradicional' | 'especial' | 'premium' | 'doce'>('todos');
  const [flavorSearch, setFlavorSearch] = useState<string>('');
  const [activeFlavorSlot, setActiveFlavorSlot] = useState<1 | 2>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isCustomizerOpen) {
      // Default size: Grande (8 fatias)
      const defaultSize = sizes.find((s) => s.id === 'grande') || sizes[0];
      setSelectedSize(defaultSize);

      // Default crust: Sem borda (0)
      const defaultCrust = crusts.find((c) => c.price === 0) || crusts[0];
      setSelectedCrust(defaultCrust);

      setSelectedExtras([]);
      setNotes('');
      setQuantity(1);
      setErrorMessage(null);
      setFlavorSearch('');
      setFlavorFilter('todos');

      // If opened from a specific product card
      if (customizingProduct) {
        const matchingFlavor = flavors.find(
          (f) =>
            f.name.toLowerCase().includes(customizingProduct.name.toLowerCase().replace('pizza ', '')) ||
            customizingProduct.name.toLowerCase().includes(f.name.toLowerCase())
        );

        if (matchingFlavor) {
          setSelectedFlavor1(matchingFlavor);
        } else {
          setSelectedFlavor1(flavors[0] || null);
        }
      } else {
        setSelectedFlavor1(flavors[0] || null);
      }

      setIsHalfAndHalf(false);
      setSelectedFlavor2(null);
      setActiveFlavorSlot(1);
    }
  }, [isCustomizerOpen, customizingProduct, sizes, crusts, flavors]);

  // Adjust half and half when size changes (e.g. Broto only allows 1 flavor)
  const handleSizeChange = (size: PizzaSize) => {
    setSelectedSize(size);
    if (size.maxFlavors < 2 && isHalfAndHalf) {
      setIsHalfAndHalf(false);
      setSelectedFlavor2(null);
    }
  };

  // Toggle extra
  const toggleExtra = (extra: PizzaExtra) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  };

  // Compute unit price
  const unitPrice = useMemo(() => {
    if (!selectedSize || !selectedFlavor1) return 0;

    const activeFlavors: PizzaFlavor[] = [selectedFlavor1];
    if (isHalfAndHalf && selectedFlavor2) {
      activeFlavors.push(selectedFlavor2);
    }

    return calculatePizzaPrice(
      selectedSize,
      activeFlavors,
      settings.halfHalfRule,
      selectedCrust || undefined,
      selectedExtras
    );
  }, [selectedSize, selectedFlavor1, selectedFlavor2, isHalfAndHalf, selectedCrust, selectedExtras, settings.halfHalfRule]);

  const totalPrice = unitPrice * quantity;

  // Filtered flavors list
  const filteredFlavors = useMemo(() => {
    return flavors.filter((f) => {
      if (!f.available) return false;
      const matchesCategory = flavorFilter === 'todos' || f.category === flavorFilter;
      const matchesSearch =
        f.name.toLowerCase().includes(flavorSearch.toLowerCase()) ||
        f.description.toLowerCase().includes(flavorSearch.toLowerCase()) ||
        f.ingredients.some((i) => i.toLowerCase().includes(flavorSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [flavors, flavorFilter, flavorSearch]);

  if (!isCustomizerOpen) return null;

  const handleSelectFlavor = (flavor: PizzaFlavor) => {
    if (activeFlavorSlot === 1) {
      setSelectedFlavor1(flavor);
      if (isHalfAndHalf && !selectedFlavor2) {
        setActiveFlavorSlot(2);
      }
    } else {
      setSelectedFlavor2(flavor);
    }
    setErrorMessage(null);
  };

  const handleAddCustomPizzaToCart = () => {
    if (!selectedSize) {
      setErrorMessage('Por favor, selecione o tamanho da pizza.');
      return;
    }
    if (!selectedFlavor1) {
      setErrorMessage('Por favor, selecione o primeiro sabor.');
      return;
    }
    if (isHalfAndHalf && !selectedFlavor2) {
      setErrorMessage('Por favor, selecione o segundo sabor para a pizza meio a meio.');
      return;
    }

    const activeFlavors = [selectedFlavor1];
    if (isHalfAndHalf && selectedFlavor2) {
      activeFlavors.push(selectedFlavor2);
    }

    const pizzaTitle = isHalfAndHalf && selectedFlavor2
      ? `Pizza ${selectedSize.name}: 1/2 ${selectedFlavor1.name} + 1/2 ${selectedFlavor2.name}`
      : `Pizza ${selectedFlavor1.name} (${selectedSize.name})`;

    addToCart({
      id: `custom_pizza_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: pizzaTitle,
      image: selectedFlavor1.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      unitPrice,
      quantity,
      totalPrice,
      customization: {
        size: selectedSize,
        flavors: activeFlavors,
        isHalfAndHalf,
        crust: selectedCrust || undefined,
        extras: selectedExtras,
        notes: notes.trim() || undefined,
      },
    });

    closeCustomizer();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Montar Pizza Personalizada"
        className="relative w-full max-w-3xl bg-[#10121b] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#151724] border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-royal text-white">
                Montar Pizza
              </h2>
              <p className="text-xs text-amber-300/80">
                Personalize sua pizza: tamanho, sabores, borda e adicionais
              </p>
            </div>
          </div>

          <button
            onClick={closeCustomizer}
            aria-label="Fechar modal"
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* STEP 1: Escolha o Tamanho */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">1</span>
                <span>Escolha o Tamanho</span>
                <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-amber-400 font-medium">
                {selectedSize ? selectedSize.description : 'Selecione'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {sizes.map((s) => {
                const isSelected = selectedSize?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSizeChange(s)}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-[#161824] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-black text-white">{s.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{s.slices} fatias • {s.description.split('•')[1] || ''}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 mt-2">
                      {s.maxFlavors === 1 ? '1 Sabor' : `Até ${s.maxFlavors} Sabores`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Modalidade de Sabor (1 Sabor vs Meio a Meio) */}
          {selectedSize && selectedSize.maxFlavors > 1 && (
            <div>
              <label className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider mb-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">2</span>
                <span>Divisão dos Sabores</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsHalfAndHalf(false);
                    setSelectedFlavor2(null);
                    setActiveFlavorSlot(1);
                  }}
                  className={`p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    !isHalfAndHalf
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#161824] text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span>Pizza Inteira (1 Sabor)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsHalfAndHalf(true);
                    if (!selectedFlavor2 && flavors.length > 1) {
                      // pick another flavor
                      const second = flavors.find((f) => f.id !== selectedFlavor1?.id) || flavors[1];
                      setSelectedFlavor2(second);
                    }
                    setActiveFlavorSlot(2);
                  }}
                  className={`p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    isHalfAndHalf
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#161824] text-gray-300 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Meio a Meio (2 Sabores)</span>
                </button>
              </div>

              {isHalfAndHalf && (
                <p className="text-[11px] text-amber-300/80 mt-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                  Regra da pizzaria: o valor de pizzas meio a meio é calculado pelo{' '}
                  <strong className="text-amber-300">
                    {settings.halfHalfRule === 'highest_price' ? 'sabor de maior valor' : 'preço médio dos sabores'}
                  </strong>.
                </p>
              )}
            </div>
          )}

          {/* STEP 3: Seleção dos Sabores */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <label className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">3</span>
                <span>Escolha o(s) Sabor(es)</span>
                <span className="text-red-400">*</span>
              </label>

              {/* Slot selector when Half & Half */}
              {isHalfAndHalf && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFlavorSlot(1)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      activeFlavorSlot === 1
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#161824] text-gray-300 border-gray-700'
                    }`}
                  >
                    1º Sabor: {selectedFlavor1 ? selectedFlavor1.name.slice(0, 15) : 'Pendente'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFlavorSlot(2)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      activeFlavorSlot === 2
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#161824] text-gray-300 border-gray-700'
                    }`}
                  >
                    2º Sabor: {selectedFlavor2 ? selectedFlavor2.name.slice(0, 15) : 'Selecionar'}
                  </button>
                </div>
              )}
            </div>

            {/* Flavor Category Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['todos', 'tradicional', 'especial', 'premium', 'doce'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFlavorFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                      flavorFilter === cat
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#181a27] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {cat === 'todos' ? 'Todos os Sabores' : cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Filtrar sabor ou ingrediente..."
                value={flavorSearch}
                onChange={(e) => setFlavorSearch(e.target.value)}
                className="w-full sm:w-56 px-3 py-1.5 text-xs bg-[#181a27] border border-gray-800 focus:border-amber-500 rounded-lg text-white outline-none"
              />
            </div>

            {/* Flavors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredFlavors.map((flavor) => {
                const isSelectedInSlot1 = selectedFlavor1?.id === flavor.id;
                const isSelectedInSlot2 = selectedFlavor2?.id === flavor.id;
                const isSelected = isHalfAndHalf
                  ? (activeFlavorSlot === 1 && isSelectedInSlot1) || (activeFlavorSlot === 2 && isSelectedInSlot2)
                  : isSelectedInSlot1;

                return (
                  <button
                    key={flavor.id}
                    type="button"
                    onClick={() => handleSelectFlavor(flavor)}
                    className={`p-3 rounded-xl text-left border transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : isSelectedInSlot1 || isSelectedInSlot2
                        ? 'bg-amber-500/5 border-amber-500/40'
                        : 'bg-[#161824] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-white">{flavor.name}</span>
                        {flavor.category === 'premium' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                            Premium
                          </span>
                        )}
                        {flavor.category === 'especial' && (
                          <span className="text-[9px] bg-red-600/30 text-red-300 px-1.5 py-0.5 rounded border border-red-500/40 font-bold">
                            Especial
                          </span>
                        )}
                        {flavor.category === 'doce' && (
                          <span className="text-[9px] bg-pink-600/30 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/40 font-bold">
                            Doce
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {flavor.ingredients.join(', ')}
                      </p>
                      <span className="text-xs font-extrabold text-amber-400 mt-1 block">
                        Grande: {formatCurrency(flavor.priceGrande)}
                      </span>
                    </div>

                    <div className="mt-1">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-[10px] text-gray-400">
                          +
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: Borda Recheada */}
          <div>
            <label className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider mb-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">4</span>
              <span>Borda Recheada</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {crusts.map((crust) => {
                const isSelected = selectedCrust?.id === crust.id;
                return (
                  <button
                    key={crust.id}
                    type="button"
                    onClick={() => setSelectedCrust(crust)}
                    className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-[#161824] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white block">{crust.name}</span>
                      {crust.description && (
                        <span className="text-[10px] text-gray-400 block">{crust.description}</span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-amber-400 ml-2 whitespace-nowrap">
                      {crust.price === 0 ? 'Incluso' : `+ ${formatCurrency(crust.price)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 5: Ingredientes Adicionais (Extras) */}
          <div>
            <label className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider mb-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">5</span>
              <span>Ingredientes Extras (Opcional)</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {extras.map((extra) => {
                const isChecked = selectedExtras.some((e) => e.id === extra.id);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400'
                        : 'bg-[#161824] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-medium text-white block">{extra.name}</span>
                      <span className="text-[11px] font-bold text-amber-400 block">+ {formatCurrency(extra.price)}</span>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      isChecked ? 'bg-amber-500 text-black border-amber-400' : 'border-gray-600'
                    }`}>
                      {isChecked && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 6: Observações */}
          <div>
            <label className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider mb-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">6</span>
              <span>Observações para o Pizzaiolo</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, massa bem crocante, fatiar em 16 pedacinhos..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar with Live Total & Add Button */}
        <div className="p-4 sm:p-5 bg-[#141622] border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Quantity and Price summary */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            {/* Quantity +/- */}
            <div className="flex items-center gap-2 bg-[#1b1e2c] border border-gray-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors font-bold"
              >
                -
              </button>
              <span className="text-sm font-extrabold text-white px-2">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
                className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-colors font-bold"
              >
                +
              </button>
            </div>

            {/* Total value */}
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                Total da Pizza
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>

          {/* Add CTA */}
          <button
            type="button"
            onClick={handleAddCustomPizzaToCart}
            aria-label="Adicionar Pizza ao Carrinho"
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 border border-red-500/40 active:scale-95 transition-all"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Adicionar ao Carrinho</span>
            <span>•</span>
            <span>{formatCurrency(totalPrice)}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
