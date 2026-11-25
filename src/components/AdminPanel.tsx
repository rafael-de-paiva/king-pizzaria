import { CategoryManager } from './CategoryManager';
import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/pricing';
import { OrderStatus, PizzaFlavor, Product, StoreSettings } from '../types';
import {
  ShieldCheck,
  X,
  Lock,
  LogOut,
  TrendingUp,
  ShoppingBag,
  Pizza,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    isAdminLoggedIn,
    adminAuthStatus,
    setupAdmin,
    loginAdmin,
    logoutAdmin,
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    flavors,
    addFlavor,
    updateFlavor,
    deleteFlavor,
    crusts,
    settings,
    updateSettings,
    orders,
    updateOrderStatus,
    resetToDefaults,
  } = useStore();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'produtos' | 'pizzas' | 'configuracoes'>('dashboard');

  // Auth password input
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Product edit modal
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [productError, setProductError] = useState('');
  const selectedCategory = categories.some(c => c.id === categoryFilter) ? categoryFilter : '';
  const listedProducts = selectedCategory ? products.filter(p => p.category === selectedCategory) : products;

  // Flavor edit modal
  const [editingFlavor, setEditingFlavor] = useState<Partial<PizzaFlavor> | null>(null);
  const [isFlavorModalOpen, setIsFlavorModalOpen] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  if (!isAdminOpen) return null;

  // Handle First-Run Setup or Login
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passwordInput.trim().length < 4) {
      setAuthError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('As senhas digitadas não coincidem.');
      return;
    }
    setIsAuthenticating(true);
    const result = await setupAdmin(passwordInput);
    setIsAuthenticating(false);
    if (!result.ok) {
      setAuthError(result.error || 'Não foi possível salvar a senha inicial.');
    } else {
      setPasswordInput('');
      setConfirmPasswordInput('');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    const result = await loginAdmin(passwordInput);
    setIsAuthenticating(false);
    if (!result.ok) {
      setAuthError(result.error || 'Senha incorreta. Verifique e tente novamente.');
    } else {
      setPasswordInput('');
    }
  };

  // Metrics for dashboard
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelado' ? o.total : 0), 0);
  const totalOrdersCount = orders.length;
  const averageTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settingsForm);
    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 2500);
  };

  // Product Modal Submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      if (editingProduct.id) {
        await updateProduct(editingProduct.id, editingProduct);
      } else {
        await addProduct({
          name: editingProduct.name || '',
          description: editingProduct.description || '',
          price: Number(editingProduct.price),
          category: editingProduct.category || '',
          ingredients: typeof editingProduct.ingredients === 'string'
            ? (editingProduct.ingredients as string).split(',').map((s) => s.trim())
            : editingProduct.ingredients || [],
          image: editingProduct.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
          available: editingProduct.available ?? true,
          badge: editingProduct.badge || '',
          isPizza: editingProduct.category?.startsWith('pizzas-'),
        });
      }

    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Falha ao salvar o produto.');
      return;
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Flavor Modal Submit
  const handleSaveFlavor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlavor?.name || !editingFlavor?.priceGrande) return;

    if (editingFlavor.id) {
      await updateFlavor(editingFlavor.id, editingFlavor);
    } else {
      await addFlavor({
        name: editingFlavor.name || '',
        description: editingFlavor.description || '',
        ingredients: typeof editingFlavor.ingredients === 'string'
          ? (editingFlavor.ingredients as string).split(',').map((s) => s.trim())
          : editingFlavor.ingredients || [],
        priceGrande: Number(editingFlavor.priceGrande),
        category: editingFlavor.category || 'tradicional',
        available: editingFlavor.available ?? true,
        image: editingFlavor.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      });
    }

    setIsFlavorModalOpen(false);
    setEditingFlavor(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Painel Administrativo da King Pizzaria"
        className="relative w-full max-w-5xl bg-[#0f111a] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto"
      >
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-[#141624] border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-royal text-white flex items-center gap-1.5">
                Painel Administrativo • King Pizzaria
              </h2>
              <p className="text-xs text-amber-300/80">
                Gerencie produtos, preços, pedidos, taxas e horários
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={logoutAdmin}
                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-lg border border-red-500/40 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
            <button
              onClick={() => setIsAdminOpen(false)}
              aria-label="Fechar painel"
              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!isAdminLoggedIn ? (
            adminAuthStatus.requiresSetup ? (
              /* First-Run Admin Password Setup */
              <div className="max-w-md mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-black font-royal text-white">Configuração Inicial de Acesso</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Defina a senha de administrador que ficará salva com segurança no banco de dados.
                  </p>
                </div>

                <form onSubmit={handleSetupSubmit} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Crie a senha de administrador (mín. 4 caracteres)"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 bg-[#161824] border border-gray-700 focus:border-amber-500 rounded-xl text-white text-center text-sm outline-none"
                    autoFocus
                  />
                  <input
                    type="password"
                    placeholder="Confirme a senha"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 bg-[#161824] border border-gray-700 focus:border-amber-500 rounded-xl text-white text-center text-sm outline-none"
                  />

                  {authError && (
                    <p className="text-xs text-red-400 font-medium">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-black font-black text-sm rounded-xl shadow-lg transition-all"
                  >
                    {isAuthenticating ? 'Salvando...' : 'Definir Senha e Entrar'}
                  </button>
                </form>
              </div>
            ) : (
              /* Login Form */
              <div className="max-w-md mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-black font-royal text-white">Área Administrativa Restrita</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Digite a senha de administrador da King Pizzaria para gerenciar a loja.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Senha de acesso"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 bg-[#161824] border border-gray-700 focus:border-amber-500 rounded-xl text-white text-center text-sm outline-none"
                    autoFocus
                  />

                  {authError && (
                    <p className="text-xs text-red-400 font-medium">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-black font-black text-sm rounded-xl shadow-lg transition-all"
                  >
                    {isAuthenticating ? 'Entrando...' : 'Entrar no Painel'}
                  </button>
                </form>
              </div>
            )
          ) : (
            /* Logged in Admin Interface */
            <div className="space-y-6">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-gray-800 pb-3 overflow-x-auto">
                {[
                  { id: 'dashboard', label: 'Dashboard & Pedidos', icon: TrendingUp },
                  { id: 'produtos', label: 'Gerenciar Produtos', icon: ShoppingBag },
                  { id: 'pizzas', label: 'Pizzas & Sabores', icon: Pizza },
                  { id: 'configuracoes', label: 'Configurações da Loja', icon: Settings },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                        isActive
                          ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                          : 'bg-[#151724] text-gray-400 hover:text-white border-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#141624] border border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Faturamento Total</span>
                        <span className="text-2xl font-black text-amber-400 mt-0.5 block">{formatCurrency(totalRevenue)}</span>
                        <span className="text-[10px] text-emerald-400">Pedidos registrados no sistema</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#141624] border border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Total de Pedidos</span>
                        <span className="text-2xl font-black text-white mt-0.5 block">{totalOrdersCount}</span>
                        <span className="text-[10px] text-gray-400">Enviados via WhatsApp</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#141624] border border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Ticket Médio</span>
                        <span className="text-2xl font-black text-amber-400 mt-0.5 block">{formatCurrency(averageTicket)}</span>
                        <span className="text-[10px] text-gray-400">Por pedido realizado</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Orders Queue */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Fila de Pedidos Recebidos ({orders.length})</span>
                      </h3>
                      <span className="text-xs text-gray-400">Atualizado em tempo real</span>
                    </div>

                    {orders.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-[#141624] border border-gray-800 text-center text-gray-400 space-y-2">
                        <p className="text-sm">Nenhum pedido registrado ainda.</p>
                        <p className="text-xs text-gray-500">Quando os clientes finalizarem pedidos pelo WhatsApp, eles aparecerão aqui com status e comanda completa!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 rounded-2xl bg-[#141624] border border-gray-800 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-2.5">
                              <div>
                                <span className="text-xs font-black text-amber-400">
                                  Pedido #{ord.orderNumber}
                                </span>
                                <span className="text-xs text-gray-300 font-bold ml-2">
                                  {ord.customer.name} ({ord.customer.phone})
                                </span>
                                <span className="text-[10px] text-gray-400 block sm:inline sm:ml-2">
                                  {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ord.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-amber-400">
                                  {formatCurrency(ord.total)}
                                </span>

                                {/* Status Selector */}
                                <select
                                  value={ord.status}
                                  onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                                  className="text-xs bg-[#1a1c2a] text-white border border-gray-700 rounded-lg px-2 py-1 outline-none font-bold"
                                >
                                  <option value="recebido">Recebido</option>
                                  <option value="preparando">No Forno / Preparando</option>
                                  <option value="saiu_entrega">Saiu para Entrega</option>
                                  <option value="finalizado">Finalizado / Entregue</option>
                                  <option value="cancelado">Cancelado</option>
                                </select>
                              </div>
                            </div>

                            {/* Items breakdown */}
                            <div className="text-xs text-gray-300 space-y-1">
                              {ord.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span className="text-gray-400">{formatCurrency(item.totalPrice)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Address if delivery */}
                            {ord.address && (
                              <p className="text-[11px] text-gray-400 bg-[#0f111a] p-2 rounded-lg">
                                Endereço: {ord.address.street}, {ord.address.number} - {ord.address.neighborhood} {ord.address.complement && `(${ord.address.complement})`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: GERENCIAR PRODUTOS */}
              {activeTab === 'produtos' && (
                <div className="space-y-4">
                  <CategoryManager selected={selectedCategory} onSelect={setCategoryFilter} />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Produtos Cadastrados ({listedProducts.length})
                      </h3>
                      <p className="text-xs text-gray-400">Edite preços, fotos, descrições ou adicione novos itens.</p>
                    </div>

                    <button
                      onClick={() => {
                        setProductError('');
                        setEditingProduct({
                          name: '',
                          description: '',
                          price: 45.0,
                          category: selectedCategory || categories[0]?.id || '',
                          ingredients: [],
                          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
                          available: true,
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Produto</span>
                    </button>
                  </div>

                  {/* Products Table/List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {listedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-[#141624] border border-gray-800 flex flex-col justify-between space-y-3"
                      >
                        <div className="flex gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-700"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{p.name}</h4>
                            <span className="text-[10px] text-amber-400 block">{categories.find(c => c.id === p.category)?.name}</span>
                            <span className="text-sm font-black text-white">{formatCurrency(p.price)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-800 text-xs">
                          <button
                            onClick={() => toggleProductAvailability(p.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              p.available
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {p.available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{p.available ? 'Ativo' : 'Pausado'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setProductError('');
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente excluir "${p.name}"?`)) {
                                  deleteProduct(p.id).catch(err => alert(err.message));
                                }
                              }}
                              className="p-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 rounded-lg"
                              title="Excluir Produto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PIZZAS & SABORES */}
              {activeTab === 'pizzas' && (
                <div className="space-y-6">
                  {/* Flavors Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Sabores Cadastrados para Personalização ({flavors.length})
                      </h4>
                      <button
                        onClick={() => {
                          setEditingFlavor({
                            name: '',
                            description: '',
                            ingredients: [],
                            priceGrande: 50.0,
                            category: 'tradicional',
                            available: true,
                          });
                          setIsFlavorModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-lg flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Sabor</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {flavors.map((flv) => (
                        <div key={flv.id} className="p-3 bg-[#141624] border border-gray-800 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-white block">{flv.name}</span>
                              <span className="text-[10px] text-amber-400 uppercase">{flv.category}</span>
                            </div>
                            <span className="text-xs font-black text-amber-400">
                              Tam. G: {formatCurrency(flv.priceGrande)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-1">{flv.ingredients.join(', ')}</p>

                          <div className="flex justify-end gap-1.5 pt-1 border-t border-gray-800">
                            <button
                              onClick={() => {
                                setEditingFlavor(flv);
                                setIsFlavorModalOpen(true);
                              }}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir sabor "${flv.name}"?`)) {
                                  deleteFlavor(flv.id);
                                }
                              }}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stuffed Crusts */}
                  <div className="space-y-3 pt-4 border-t border-gray-800">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Bordas Recheadas ({crusts.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {crusts.map((c) => (
                        <div key={c.id} className="p-3 bg-[#141624] border border-gray-800 rounded-xl flex justify-between items-center">
                          <div>
                            <span className="text-xs font-bold text-white block">{c.name}</span>
                            <span className="text-[11px] text-amber-400 font-extrabold">{formatCurrency(c.price)}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">Configurado</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONFIGURAÇÕES DA LOJA */}
              {activeTab === 'configuracoes' && (
                <form onSubmit={handleSaveSettings} className="space-y-5 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Store Name */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Nome da Pizzaria</label>
                      <input
                        type="text"
                        value={settingsForm.storeName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* Slogan */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Frase de Efeito (Slogan)</label>
                      <input
                        type="text"
                        value={settingsForm.slogan}
                        onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">WhatsApp Oficial (DDD + Número)</label>
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white font-mono"
                      />
                      <span className="text-[10px] text-gray-500">Padrão solicitado: 5585985280354</span>
                    </div>

                    {/* Fixed Delivery Fee */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Taxa Fixa de Entrega (R$)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={settingsForm.deliveryFee}
                        onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      />
                      <span className="text-[10px] text-gray-500">Cobrada para qualquer bairro na modalidade Entrega</span>
                    </div>

                    {/* Half & Half Pricing Rule */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Cálculo de Pizza Meio a Meio</label>
                      <select
                        value={settingsForm.halfHalfRule}
                        onChange={(e) => setSettingsForm({ ...settingsForm, halfHalfRule: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      >
                        <option value="highest_price">Cobrar pelo sabor de MAIOR valor (Padrão)</option>
                        <option value="average">Cobrar pela MÉDIA dos sabores</option>
                      </select>
                    </div>

                    {/* Status Override */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Status de Funcionamento</label>
                      <select
                        value={settingsForm.manualStatusOverride}
                        onChange={(e) => setSettingsForm({ ...settingsForm, manualStatusOverride: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      >
                        <option value="auto">Automático (seguir horários de abertura)</option>
                        <option value="open">Forçar Aberto Agora</option>
                        <option value="closed">Forçar Fechado Agora</option>
                      </select>
                    </div>

                    {/* Opening Hours */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Horário de Abertura</label>
                      <input
                        type="time"
                        value={settingsForm.openingHours.openTime}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          openingHours: { ...settingsForm.openingHours, openTime: e.target.value },
                        })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Horário de Fechamento</label>
                      <input
                        type="time"
                        value={settingsForm.openingHours.closeTime}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          openingHours: { ...settingsForm.openingHours, closeTime: e.target.value },
                        })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* PIX Key */}
                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Chave PIX</label>
                      <input
                        type="text"
                        value={settingsForm.pixKey}
                        onChange={(e) => setSettingsForm({ ...settingsForm, pixKey: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Beneficiário do PIX</label>
                      <input
                        type="text"
                        value={settingsForm.pixBeneficiary}
                        onChange={(e) => setSettingsForm({ ...settingsForm, pixBeneficiary: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-300 block mb-1 font-semibold">Endereço Físico</label>
                      <input
                        type="text"
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-[#161824] border border-gray-800 focus:border-amber-500 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  {settingsSavedNotice && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Configurações atualizadas com sucesso e salvas!</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all"
                    >
                      Salvar Alterações
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Restaurar configurações e produtos padrão da King Pizzaria?')) {
                          await resetToDefaults();
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restaurar dados padrão</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}
        </div>

        {/* Product Modal (Create/Edit) */}
        {isProductModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80">
            <div className="bg-[#141624] border border-amber-500/40 rounded-2xl p-5 max-w-lg w-full space-y-4">
              <h4 className="text-base font-bold text-white font-royal">
                {editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}
              </h4>

              <form onSubmit={handleSaveProduct} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Categoria</label>
                  <select
                    required
                    value={editingProduct?.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                  >
                    <option value="" disabled>Selecione uma categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-300 block mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={editingProduct?.price || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-300 block mb-1">Badge (Ex: Mais Vendido)</label>
                    <input
                      type="text"
                      value={editingProduct?.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={editingProduct?.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={editingProduct?.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                {productError && <p role="alert" className="text-sm text-red-300">{productError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 text-xs rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg"
                  >
                    Salvar Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Flavor Modal (Create/Edit) */}
        {isFlavorModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80">
            <div className="bg-[#141624] border border-amber-500/40 rounded-2xl p-5 max-w-lg w-full space-y-4">
              <h4 className="text-base font-bold text-white font-royal">
                {editingFlavor?.id ? 'Editar Sabor' : 'Novo Sabor de Pizza'}
              </h4>

              <form onSubmit={handleSaveFlavor} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Nome do Sabor</label>
                  <input
                    type="text"
                    required
                    value={editingFlavor?.name || ''}
                    onChange={(e) => setEditingFlavor({ ...editingFlavor, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-300 block mb-1">Preço Pizza Grande (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={editingFlavor?.priceGrande || ''}
                      onChange={(e) => setEditingFlavor({ ...editingFlavor, priceGrande: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-300 block mb-1">Categoria do Sabor</label>
                    <select
                      value={editingFlavor?.category || 'tradicional'}
                      onChange={(e) => setEditingFlavor({ ...editingFlavor, category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                    >
                      <option value="tradicional">Tradicional</option>
                      <option value="especial">Especial</option>
                      <option value="premium">Premium</option>
                      <option value="doce">Doce</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Ingredientes (Separados por vírgula)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingFlavor?.ingredients) ? editingFlavor?.ingredients.join(', ') : ''}
                    onChange={(e) => setEditingFlavor({ ...editingFlavor, ingredients: e.target.value.split(',').map((s) => s.trim()) })}
                    placeholder="Mussarela, calabresa, cebola..."
                    className="w-full px-3 py-2 bg-[#1b1e2e] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFlavorModalOpen(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 text-xs rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg"
                  >
                    Salvar Sabor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
