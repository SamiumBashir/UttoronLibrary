"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Book, CartItem, PublicUser } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  text: string;
}

interface StoreContextValue {
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  wishlist: string[];
  user: PublicUser | null;
  authLoading: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  addToCart: (book: Book, quantity?: number, openDrawer?: boolean) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (bookId: string, title?: string) => Promise<void>;
  isInWishlist: (bookId: string) => boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  notify: (text: string, type?: ToastMessage["type"]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = "uttoron_cart_v1";
const WISHLIST_STORAGE_KEY = "uttoron_wishlist_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const notify = useCallback((text: string, type: ToastMessage["type"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { user: PublicUser | null };
        setUser(data.user);
        if (data.user) {
          setWishlist(data.user.wishlist || []);
        }
      }
    } catch {
      // keep existing state on transient error
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const rawCart = localStorage.getItem(CART_STORAGE_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart) as CartItem[];
        if (Array.isArray(parsed)) setCart(parsed);
      }
      const rawWish = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (rawWish) {
        const parsed = JSON.parse(rawWish) as string[];
        if (Array.isArray(parsed)) setWishlist(parsed);
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
    void refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated || user) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist, hydrated, user]);

  const addToCart = useCallback(
    (book: Book, quantity = 1, openDrawer = true) => {
      if (book.stock <= 0) {
        notify(`"${book.title}" is currently out of stock.`, "error");
        return;
      }

      setCart((prev) => {
        const existing = prev.find((i) => i.bookId === book.id);
        const currentQty = existing ? existing.quantity : 0;
        const desired = currentQty + quantity;
        if (desired > book.stock) {
          notify(
            `Only ${book.stock} copy(ies) of "${book.title}" available in stock.`,
            "error"
          );
          if (currentQty >= book.stock) return prev;
        }
        const finalQty = Math.min(desired, book.stock);
        if (existing) {
          notify(`Updated "${book.title}" quantity to ${finalQty}.`, "success");
          return prev.map((i) =>
            i.bookId === book.id ? { ...i, quantity: finalQty, stock: book.stock } : i
          );
        }
        notify(`Added "${book.title}" to your reading bag.`, "success");
        return [
          ...prev,
          {
            bookId: book.id,
            slug: book.slug,
            title: book.title,
            authorName: book.authorName,
            price: book.price,
            originalPrice: book.originalPrice,
            stock: book.stock,
            quantity: finalQty,
            coverPalette: book.coverPalette,
            spineColor: book.spineColor,
            isbn: book.isbn,
          },
        ];
      });

      if (openDrawer) {
        setCartOpen(true);
      }
    },
    [notify]
  );

  const removeFromCart = useCallback(
    (bookId: string) => {
      setCart((prev) => {
        const target = prev.find((i) => i.bookId === bookId);
        if (target) {
          notify(`Removed "${target.title}" from bag.`, "info");
        }
        return prev.filter((i) => i.bookId !== bookId);
      });
    },
    [notify]
  );

  const updateQuantity = useCallback(
    (bookId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(bookId);
        return;
      }
      setCart((prev) =>
        prev.map((item) => {
          if (item.bookId !== bookId) return item;
          if (quantity > item.stock) {
            notify(
              `Cannot exceed available stock (${item.stock} copies) for "${item.title}".`,
              "error"
            );
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity };
        })
      );
    },
    [notify, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    async (bookId: string, title?: string) => {
      if (user) {
        try {
          const res = await fetch("/api/account/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookId }),
          });
          if (res.ok) {
            const data = (await res.json()) as { wishlist: string[] };
            setWishlist(data.wishlist);
            const added = data.wishlist.includes(bookId);
            notify(
              added
                ? `Saved ${title ? `"${title}"` : "edition"} to your wishlist.`
                : `Removed ${title ? `"${title}"` : "edition"} from wishlist.`,
              "info"
            );
            return;
          }
        } catch {
          // fallback below
        }
      }

      setWishlist((prev) => {
        const exists = prev.includes(bookId);
        const next = exists ? prev.filter((id) => id !== bookId) : [...prev, bookId];
        notify(
          !exists
            ? `Saved ${title ? `"${title}"` : "edition"} to your wishlist.`
            : `Removed ${title ? `"${title}"` : "edition"} from wishlist.`,
          "info"
        );
        return next;
      });
    },
    [notify, user]
  );

  const isInWishlist = useCallback(
    (bookId: string) => wishlist.includes(bookId),
    [wishlist]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    notify("Signed out of your library account.", "info");
  }, [notify]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  return (
    <StoreContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        wishlist,
        user,
        authLoading,
        isCartOpen,
        isSearchOpen,
        setCartOpen,
        setSearchOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        refreshAuth,
        logout,
        notify,
      }}
    >
      {children}

      {/* Accessible Global Toast Stack */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[90] flex max-w-sm flex-col gap-2.5"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
                t.type === "error"
                  ? "border-[#d93829]/45 bg-[#1f1211]/95 text-[#fde8e8]"
                  : t.type === "info"
                  ? "border-[#dedbd2] bg-white/95 text-[#141413]"
                  : "border-[#141413]/20 bg-[#141413]/95 text-[#f6f5f0]"
              }`}
            >
              {t.type === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d93829]" />
              )}
              <span className="flex-1 leading-snug">{t.text}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className={`transition ${
                  t.type === "info"
                    ? "text-[#62605a] hover:text-[#141413]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}

