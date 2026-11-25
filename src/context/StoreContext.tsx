import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type {
  CartItem,
  CategoryInfo,
  Order,
  OrderStatus,
  PizzaCrust,
  PizzaExtra,
  PizzaFlavor,
  PizzaSize,
  Product,
  StoreSettings,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_CRUSTS,
  INITIAL_EXTRAS,
  INITIAL_FLAVORS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_SIZES,
} from '../data/initialData';
import { isStoreOpen } from '../utils/pricing';
import { api, type AdminAuthStatus } from '../services/api';

interface StoreContextType {
  products: Product[];
  categories: CategoryInfo[];
  sizes: PizzaSize[];
  flavors: PizzaFlavor[];
  crusts: PizzaCrust[];
  extras: PizzaExtra[];
  settings: StoreSettings;
  cart: CartItem[];
  orders: Order[];
  isLoadingStore: boolean;
  isOpen: boolean;
  statusText: string;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  // Modals & Drawers
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isCustomizerOpen: boolean;
  customizingProduct: Product | null;
  openCustomizer: (product?: Product) => void;
  closeCustomizer: () => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminLoggedIn: boolean;
  adminAuthStatus: AdminAuthStatus;
  isFlyerOpen: boolean;
  setIsFlyerOpen: (open: boolean) => void;

  // Cart operations
  addToCart: (item: CartItem) => Promise<void>;
  updateCartItemQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotalCount: number;
  cartSubtotal: number;

  // Admin auth & settings
  setupAdmin: (password: string) => Promise<{ ok: boolean; error?: string }>;
  loginAdmin: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;

  saveCategory: (id: string, name: string) => Promise<CategoryInfo>;
  deleteCategory: (id: string) => Promise<void>;
  // Product management
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductAvailability: (id: string) => Promise<void>;

  // Pizza components management
  addFlavor: (flavor: Omit<PizzaFlavor, 'id'>) => Promise<void>;
  updateFlavor: (id: string, flavor: Partial<PizzaFlavor>) => Promise<void>;
  deleteFlavor: (id: string) => Promise<void>;

  addSize: (size: Omit<PizzaSize, 'id'>) => Promise<void>;
  updateSize: (id: string, size: Partial<PizzaSize>) => Promise<void>;
  deleteSize: (id: string) => Promise<void>;

  addCrust: (crust: Omit<PizzaCrust, 'id'>) => Promise<void>;
  updateCrust: (id: string, crust: Partial<PizzaCrust>) => Promise<void>;
  deleteCrust: (id: string) => Promise<void>;

  addExtra: (extra: Omit<PizzaExtra, 'id'>) => Promise<void>;
  updateExtra: (id: string, extra: Partial<PizzaExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;

  // Orders
  placeOrder: (orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<CategoryInfo[]>(INITIAL_CATEGORIES);
  const [sizes, setSizes] = useState<PizzaSize[]>(INITIAL_SIZES);
  const [flavors, setFlavors] = useState<PizzaFlavor[]>(INITIAL_FLAVORS);
  const [crusts, setCrusts] = useState<PizzaCrust[]>(INITIAL_CRUSTS);
  const [extras, setExtras] = useState<PizzaExtra[]>(INITIAL_EXTRAS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [isLoadingStore, setIsLoadingStore] = useState<boolean>(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // In-memory admin token (never stored in localStorage/sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminAuthStatus, setAdminAuthStatus] = useState<AdminAuthStatus>({
    configured: true,
    requiresSetup: false,
  });

  // UI state
  const [activeCategory, setActiveCategory] = useState<string>('pizzas-tradicionais');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFlyerOpen, setIsFlyerOpen] = useState(false);

  useEffect(() => {
    if (!categories.some(category => category.id === activeCategory)) {
      setActiveCategory(categories[0]?.id || '');
    }
  }, [categories, activeCategory]);

  const isAdminLoggedIn = Boolean(adminToken);

  const handleApiError = useCallback((err: unknown) => {
    const status = (err as { status?: number })?.status;
    if (status === 401) {
      setAdminToken(null);
      setOrders([]);
    }
    throw err;
  }, []);

  // Load initial store catalog, settings, cart and auth status from SQLite API
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [storeData, cartData, authData] = await Promise.all([
          api.fetchStore(),
          api.fetchCart(),
          api.getAdminAuthStatus(),
        ]);
        if (!active) return;
        setProducts(storeData.products);
        setCategories(storeData.categories);
        setSizes(storeData.sizes);
        setFlavors(storeData.flavors);
        setCrusts(storeData.crusts);
        setExtras(storeData.extras);
        setSettings(storeData.settings);
        setCart(cartData.items);
        setAdminAuthStatus(authData);
      } catch (err) {
        console.error('Erro ao carregar dados da API:', err);
      } finally {
        if (active) setIsLoadingStore(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Refresh admin auth status when opening admin modal
  useEffect(() => {
    if (!isAdminOpen) return;
    api.getAdminAuthStatus().then(setAdminAuthStatus).catch(() => {});
  }, [isAdminOpen]);

  // Current store status calculation
  const { isOpen, statusText } = useMemo(() => isStoreOpen(settings), [settings]);

  // Cart metrics
  const cartTotalCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [cart]);

  // Cart methods via API
  const addToCart = async (newItem: CartItem) => {
    const res = await api.addCartItem(newItem);
    setCart(res.items);
  };

  const updateCartItemQuantity = async (id: string, quantity: number) => {
    const res = await api.updateCartItemQuantity(id, quantity);
    setCart(res.items);
  };

  const removeFromCart = async (id: string) => {
    const res = await api.removeCartItem(id);
    setCart(res.items);
  };

  const clearCart = async () => {
    const res = await api.clearCart();
    setCart(res.items);
  };

  // Customizer
  const openCustomizer = (product?: Product) => {
    setCustomizingProduct(product || null);
    setIsCustomizerOpen(true);
  };

  const closeCustomizer = () => {
    setIsCustomizerOpen(false);
    setCustomizingProduct(null);
  };

  // Admin auth
  const setupAdmin = async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { token } = await api.setupAdmin(password);
      setAdminToken(token);
      setAdminAuthStatus({ configured: true, requiresSetup: false });
      const { orders: adminOrders } = await api.fetchAdminOrders(token);
      setOrders(adminOrders);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Erro ao configurar senha.' };
    }
  };

  const loginAdmin = async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { token } = await api.loginAdmin(password);
      setAdminToken(token);
      const { orders: adminOrders } = await api.fetchAdminOrders(token);
      setOrders(adminOrders);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Senha incorreta.' };
    }
  };

  const logoutAdmin = async () => {
    const current = adminToken;
    setAdminToken(null);
    setOrders([]);
    if (current) {
      await api.logoutAdmin(current).catch(() => {});
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!adminToken) return;
    try {
      const { settings: updated } = await api.updateSettings(adminToken, newSettings);
      setSettings(updated);
    } catch (err) {
      handleApiError(err);
    }
  };

  const resetToDefaults = async () => {
    if (!adminToken) return;
    try {
      const data = await api.resetDefaults(adminToken);
      setProducts(data.products);
      setCategories(data.categories);
      setSizes(data.sizes);
      setFlavors(data.flavors);
      setCrusts(data.crusts);
      setExtras(data.extras);
      setSettings(data.settings);
    } catch (err) {
      handleApiError(err);
    }
  };

  const saveCategory = async (id: string, name: string) => {
    if (!adminToken) throw new Error('Entre no painel para salvar a categoria.');
    const { category } = await api.saveCategory(adminToken, id, name);
    setCategories(previous => id
      ? previous.map(item => item.id === id ? category : item)
      : [...previous, category]);
    return category;
  };

  const deleteCategory = async (id: string) => {
    if (!adminToken) throw new Error('Entre no painel para excluir a categoria.');
    await api.deleteCategory(adminToken, id);
    setCategories(previous => previous.filter(item => item.id !== id));
  };

  // Product management
  const addProduct = async (p: Omit<Product, 'id'>) => {
    if (!adminToken) return;
    try {
      const { product } = await api.createProduct(adminToken, p);
      setProducts((prev) => [product, ...prev]);
    } catch (err) {
      handleApiError(err);
    }
  };

  const updateProduct = async (id: string, p: Partial<Product>) => {
    if (!adminToken) return;
    try {
      const { product } = await api.updateProduct(adminToken, id, p);
      setProducts((prev) => prev.map((item) => (item.id === id ? product : item)));
    } catch (err) {
      handleApiError(err);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!adminToken) return;
    try {
      await api.deleteProduct(adminToken, id);
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      handleApiError(err);
    }
  };

  const toggleProductAvailability = async (id: string) => {
    if (!adminToken) return;
    try {
      const { product } = await api.toggleProduct(adminToken, id);
      setProducts((prev) => prev.map((item) => (item.id === id ? product : item)));
    } catch (err) {
      handleApiError(err);
    }
  };

  // Pizza custom elements
  const addFlavor = async (f: Omit<PizzaFlavor, 'id'>) => {
    if (!adminToken) return;
    try {
      const { flavor } = await api.createFlavor(adminToken, f);
      setFlavors((prev) => [...prev, flavor]);
    } catch (err) {
      handleApiError(err);
    }
  };

  const updateFlavor = async (id: string, f: Partial<PizzaFlavor>) => {
    if (!adminToken) return;
    try {
      const { flavor } = await api.updateFlavor(adminToken, id, f);
      setFlavors((prev) => prev.map((item) => (item.id === id ? flavor : item)));
    } catch (err) {
      handleApiError(err);
    }
  };

  const deleteFlavor = async (id: string) => {
    if (!adminToken) return;
    try {
      await api.deleteFlavor(adminToken, id);
      setFlavors((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      handleApiError(err);
    }
  };

  const addSize = async (s: Omit<PizzaSize, 'id'>) => {
    if (!adminToken) return;
    try {
      const { size } = await api.createSize(adminToken, s);
      setSizes((prev) => [...prev, size]);
    } catch (err) {
      handleApiError(err);
    }
  };

  const updateSize = async (id: string, s: Partial<PizzaSize>) => {
    if (!adminToken) return;
    try {
      const { size } = await api.updateSize(adminToken, id, s);
      setSizes((prev) => prev.map((item) => (item.id === id ? size : item)));
    } catch (err) {
      handleApiError(err);
    }
  };

  const deleteSize = async (id: string) => {
    if (!adminToken) return;
    try {
      await api.deleteSize(adminToken, id);
      setSizes((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      handleApiError(err);
    }
  };

  const addCrust = async (c: Omit<PizzaCrust, 'id'>) => {
    if (!adminToken) return;
    try {
      const { crust } = await api.createCrust(adminToken, c);
      setCrusts((prev) => [...prev, crust]);
    } catch (err) {
      handleApiError(err);
    }
  };

  const updateCrust = async (id: string, c: Partial<PizzaCrust>) => {
    if (!adminToken) return;
    try {
      const { crust } = await api.updateCrust(adminToken, id, c);
      setCrusts((prev) => prev.map((item) => (item.id === id ? crust : item)));
    } catch (err) {
      handleApiError(err);
    }
  };

  const deleteCrust = async (id: string) => {
    if (!adminToken) return;
    try {
      await api.deleteCrust(adminToken, id);
      setCrusts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      handleApiError(err);
    }
  };

  const addExtra = async (e: Omit<PizzaExtra, 'id'>) => {
    if (!adminToken) return;
    try {
      const { extra } = await api.createExtra(adminToken, e);
      setExtras((prev) => [...prev, extra]);
    } catch (err) {
      handleApiError(err);
    }
  };

  const updateExtra = async (id: string, e: Partial<PizzaExtra>) => {
    if (!adminToken) return;
    try {
      const { extra } = await api.updateExtra(adminToken, id, e);
      setExtras((prev) => prev.map((item) => (item.id === id ? extra : item)));
    } catch (err) {
      handleApiError(err);
    }
  };

  const deleteExtra = async (id: string) => {
    if (!adminToken) return;
    try {
      await api.deleteExtra(adminToken, id);
      setExtras((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      handleApiError(err);
    }
  };

  // Orders
  const placeOrder = async (
    orderPayload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>
  ): Promise<Order> => {
    const { order } = await api.placeOrder(orderPayload);
    setCart([]);
    if (adminToken) {
      setOrders((prev) => [order, ...prev]);
    }
    return order;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!adminToken) return;
    try {
      const { order } = await api.updateOrderStatus(adminToken, orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        sizes,
        flavors,
        crusts,
        extras,
        settings,
        cart,
        orders,
        isLoadingStore,
        isOpen,
        statusText,
        activeCategory,
        setActiveCategory,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isCustomizerOpen,
        customizingProduct,
        openCustomizer,
        closeCustomizer,
        isAdminOpen,
        setIsAdminOpen,
        isAdminLoggedIn,
        adminAuthStatus,
        isFlyerOpen,
        setIsFlyerOpen,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        cartTotalCount,
        cartSubtotal,
        setupAdmin,
        loginAdmin,
        logoutAdmin,
        updateSettings,
        resetToDefaults,
        saveCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        addFlavor,
        updateFlavor,
        deleteFlavor,
        addSize,
        updateSize,
        deleteSize,
        addCrust,
        updateCrust,
        deleteCrust,
        addExtra,
        updateExtra,
        deleteExtra,
        placeOrder,
        updateOrderStatus,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
