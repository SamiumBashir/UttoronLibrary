"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/components/providers/StoreProvider";
import type { Book, Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import BookCard3D from "@/components/books/BookCard3D";
import { signInWithGoogle } from "@/lib/firebase/client";
import {
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  Shield,
  Trash2,
  User as UserIcon,
} from "lucide-react";

type AuthMode = "login" | "signup" | "forgot" | "reset";
type AccountTab = "profile" | "addresses" | "wishlist" | "orders";

function AccountContent() {
  const searchParams = useSearchParams();
  const { user, wishlist, refreshAuth, logout, notify } = useStore();

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [tab, setTab] = useState<AccountTab>("profile");

  // Auth form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // Account data
  const [orders, setOrders] = useState<Order[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine: "",
    city: "Dhaka",
    postalCode: "",
  });

  useEffect(() => {
    const qTab = searchParams.get("tab") as AccountTab | null;
    if (qTab && ["profile", "addresses", "wishlist", "orders"].includes(qTab)) {
      setTab(qTab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/books")
      .then((r) => r.json())
      .then((d: { books: Book[] }) => setAllBooks(d.books || []))
      .catch(() => {});

    if (user) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d: { orders?: Order[] }) => setOrders(d.orders || []))
        .catch(() => {});
    }
  }, [user]);

  const wishlistedBooks = allBooks.filter((b) => wishlist.includes(b.id));

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    try {
      if (authMode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          notify(data.error || "Sign in failed.", "error");
        } else {
          await refreshAuth();
          notify("Welcome back to Uttoron Prokasoni.", "success");
        }
      } else if (authMode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          notify(data.error || "Could not create account.", "error");
        } else {
          await refreshAuth();
          notify("Account created! Welcome to the library.", "success");
        }
      } else if (authMode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json()) as {
          message?: string;
          devResetToken?: string;
          error?: string;
        };
        if (!res.ok) {
          notify(data.error || "Request failed.", "error");
        } else {
          if (data.devResetToken) {
            setResetToken(data.devResetToken);
          }
          notify(data.message || "Reset instructions issued.", "info");
          setAuthMode("reset");
        }
      } else if (authMode === "reset") {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: resetToken, newPassword: password }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          notify(data.error || "Reset failed.", "error");
        } else {
          notify("Password updated. Please sign in.", "success");
          setAuthMode("login");
          setPassword("");
        }
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthBusy(true);
      const cred = await signInWithGoogle();
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        await refreshAuth();
        notify(`Welcome, ${cred.user.displayName || "Reader"}!`, "success");
      } else {
        const err = (await res.json()) as { error?: string };
        notify(err.error || "Google sign-in failed.", "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in cancelled.";
      notify(msg, "error");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addrForm),
    });
    if (res.ok) {
      await refreshAuth();
      setAddrForm({
        label: "Home",
        fullName: "",
        phone: "",
        addressLine: "",
        city: "Dhaka",
        postalCode: "",
      });
      notify("Delivery address saved.", "success");
    } else {
      notify("Could not save address.", "error");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await refreshAuth();
      notify("Address removed.", "info");
    }
  };

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-20 sm:pt-28 text-[#141413]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {!user ? (
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl sm:rounded-[2rem] border border-[#dedbd2] bg-white p-5 sm:p-8 shadow-sm">
              <p className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[#62605a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
                Reader Membership
              </p>
              <h1 className="mt-1.5 sm:mt-2 font-serif text-2xl xs:text-3xl sm:text-4xl font-semibold text-[#141413]">
                {authMode === "login"
                  ? "Sign In"
                  : authMode === "signup"
                  ? "Create Account"
                  : authMode === "forgot"
                  ? "Forgot Password"
                  : "Reset Password"}
              </h1>

              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                {authMode === "signup" && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#141413]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#141413]">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#141413]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                </div>

                {authMode === "reset" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#141413]">
                      Reset Token
                    </label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm font-mono text-[#141413] focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                )}

                {authMode !== "forgot" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#141413]">
                      {authMode === "reset" ? "New Password" : "Password"}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-4 py-3 text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full rounded-full bg-[#141413] py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#d93829]"
                >
                  {authBusy
                    ? "Processing..."
                    : authMode === "login"
                    ? "Sign In"
                    : authMode === "signup"
                    ? "Create Account"
                    : authMode === "forgot"
                    ? "Send Reset Instructions"
                    : "Update Password"}
                </button>

                {(authMode === "login" || authMode === "signup") && (
                  <>
                    <div className="relative my-3 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#dedbd2]" />
                      </div>
                      <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider text-[#62605a]">
                        or
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={handleGoogleSignIn}
                      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#dedbd2] bg-white py-3 text-xs font-semibold text-[#141413] shadow-sm transition hover:border-[#141413]"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      Continue with Google
                    </button>
                  </>
                )}
              </form>

              <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-[#dedbd2] pt-5 text-xs text-[#62605a]">
                {authMode !== "login" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="font-semibold hover:text-[#141413]"
                  >
                    Back to Sign In
                  </button>
                )}
                {authMode !== "signup" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className="font-semibold hover:text-[#141413]"
                  >
                    Create a New Account
                  </button>
                )}
                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot")}
                    className="inline-flex items-center gap-1 hover:text-[#141413]"
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Forgot Password?
                  </button>
                )}
              </div>
            </div>

            {/* Guest Wishlist Preview */}
            {wishlistedBooks.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl font-semibold text-[#141413]">
                  Your Saved Wishlist ({wishlistedBooks.length})
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2">
                  {wishlistedBooks.map((b) => (
                    <BookCard3D key={b.id} book={b} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Signed-In Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl sm:rounded-[2rem] border border-[#dedbd2] bg-white p-5 sm:p-7 text-[#141413] shadow-sm">
              <div>
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#62605a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
                  {user.role === "admin" ? "Curator & Admin Account" : "Reader Account"}
                </p>
                <h1 className="mt-1 font-serif text-2xl sm:text-4xl font-semibold">
                  {user.name}
                </h1>
                <p className="text-xs text-[#62605a]">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#141413] px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
                  >
                    <Shield className="h-4 w-4" /> CMS Console
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#dedbd2] px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold text-[#141413] hover:border-[#141413]"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 sm:mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none sm:flex-wrap">
              {(
                [
                  { id: "profile", label: "Profile", icon: UserIcon },
                  { id: "addresses", label: "Saved Addresses", icon: MapPin },
                  { id: "wishlist", label: `Wishlist (${wishlistedBooks.length})`, icon: Heart },
                  { id: "orders", label: `Order History (${orders.length})`, icon: Package },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition ${
                      active
                        ? "bg-[#141413] text-white"
                        : "border border-[#dedbd2] bg-white text-[#141413] hover:border-[#141413]"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-[#d93829]" : ""}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div className="mt-8">
              {tab === "profile" && (
                <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-8">
                  <h2 className="font-serif text-2xl font-semibold text-[#141413]">
                    Reader Details
                  </h2>
                  <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-[#62605a]">Full Name</dt>
                      <dd className="mt-1 font-semibold">{user.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#62605a]">Email</dt>
                      <dd className="mt-1 font-semibold">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#62605a]">Phone</dt>
                      <dd className="mt-1 font-semibold">{user.phone || "Not set"}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {tab === "addresses" && (
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h2 className="font-serif text-2xl font-semibold text-[#141413]">
                      Saved Delivery Addresses
                    </h2>
                    {user.addresses.length === 0 ? (
                      <p className="text-sm text-[#62605a]">No saved addresses yet.</p>
                    ) : (
                      user.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="flex items-start justify-between rounded-2xl border border-[#dedbd2] bg-white p-5"
                        >
                          <div className="text-sm">
                            <span className="rounded-full bg-[#eceae3] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#141413]">
                              {addr.label}
                            </span>
                            <p className="mt-2 font-semibold text-[#141413]">{addr.fullName}</p>
                            <p className="text-xs text-[#62605a]">{addr.addressLine}</p>
                            <p className="text-xs text-[#62605a]">
                              {addr.city}, {addr.postalCode} • {addr.phone}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label="Delete address"
                            onClick={() => void handleDeleteAddress(addr.id)}
                            className="text-[#d93829]/80 hover:text-[#d93829]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={handleAddAddress}
                    className="space-y-3 rounded-[2rem] border border-[#dedbd2] bg-white p-6"
                  >
                    <h3 className="font-serif text-xl font-semibold text-[#141413]">
                      Add New Address
                    </h3>
                    <input
                      type="text"
                      required
                      placeholder="Label (Home, Office)"
                      value={addrForm.label}
                      onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={addrForm.fullName}
                      onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone"
                      value={addrForm.phone}
                      onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Street Address"
                      value={addrForm.addressLine}
                      onChange={(e) =>
                        setAddrForm({ ...addrForm, addressLine: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Postal Code"
                        value={addrForm.postalCode}
                        onChange={(e) =>
                          setAddrForm({ ...addrForm, postalCode: e.target.value })
                        }
                        className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-full bg-[#141413] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
                    >
                      Save Address
                    </button>
                  </form>
                </div>
              )}

              {tab === "wishlist" && (
                <div>
                  {wishlistedBooks.length === 0 ? (
                    <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-12 text-center">
                      <p className="font-serif text-2xl text-[#141413]">
                        Your wishlist is empty
                      </p>
                      <Link
                        href="/books"
                        className="mt-4 inline-block rounded-full bg-[#141413] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
                      >
                        Discover Books
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {wishlistedBooks.map((book) => (
                        <BookCard3D key={book.id} book={book} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "orders" && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-12 text-center">
                      <p className="font-serif text-2xl text-[#141413]">
                        No orders placed yet
                      </p>
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <Link
                        key={ord.id}
                        href={`/orders/${ord.orderNumber}`}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dedbd2] bg-white p-5 transition hover:border-[#141413]"
                      >
                        <div>
                          <p className="font-mono text-sm font-bold text-[#141413]">
                            {ord.orderNumber}
                          </p>
                          <p className="text-xs text-[#62605a]">
                            {new Date(ord.createdAt).toLocaleDateString()} •{" "}
                            {ord.items.length} title(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-[#eceae3] px-3 py-1 text-[10px] font-semibold uppercase text-[#141413]">
                            {ord.orderStatus}
                          </span>
                          <p className="mt-1 font-serif text-xl font-bold text-[#141413]">
                            {formatPrice(ord.total)}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f6f5f0] pt-32 text-center text-sm text-[#62605a]">
          Loading account...
        </div>
      }
    >
      <AccountContent />
    </React.Suspense>
  );
}

