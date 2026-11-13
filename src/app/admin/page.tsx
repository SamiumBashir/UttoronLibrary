"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/providers/StoreProvider";
import type { Author, Book, BookCategory, Coupon, Order, OrderStatus } from "@/lib/types";
import { BOOK_CATEGORIES } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { BookPlus, Package, ShieldAlert, Tag } from "lucide-react";

export default function AdminCmsPage() {
  const { user, notify } = useStore();
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [newBook, setNewBook] = useState({
    title: "",
    authorName: "",
    category: "Fiction" as BookCategory,
    price: 680,
    originalPrice: 820,
    stock: 20,
    isbn: "",
    pages: 280,
    description: "",
  });

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 15,
    minOrderAmount: 500,
    description: "",
  });

  const loadCms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as {
          books: Book[];
          authors: Author[];
          coupons: Coupon[];
          orders?: Order[];
        };
        setBooks(data.books || []);
        setAuthors(data.authors || []);
        setCoupons(data.coupons || []);
        setOrders(data.orders || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCms();
  }, [user]);

  const handleInventorySave = async (bookId: string, stock: number, price: number) => {
    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "inventory", payload: { bookId, stock, price } }),
    });
    if (res.ok) {
      notify("Inventory & pricing updated.", "success");
      await loadCms();
    } else {
      notify("Update failed.", "error");
    }
  };

  const handlePublishBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBook),
    });
    if (res.ok) {
      notify("New edition published to catalog!", "success");
      setNewBook({
        title: "",
        authorName: "",
        category: "Fiction",
        price: 680,
        originalPrice: 820,
        stock: 20,
        isbn: "",
        pages: 280,
        description: "",
      });
      await loadCms();
    } else {
      const err = (await res.json()) as { error?: string };
      notify(err.error || "Could not publish book.", "error");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "coupon", payload: newCoupon }),
    });
    if (res.ok) {
      notify("Coupon saved.", "success");
      setNewCoupon({
        code: "",
        type: "percentage",
        value: 15,
        minOrderAmount: 500,
        description: "",
      });
      await loadCms();
    } else {
      notify("Could not save coupon.", "error");
    }
  };

  const handleOrderStatus = async (orderNumber: string, orderStatus: OrderStatus) => {
    const res = await fetch(`/api/orders/${orderNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus }),
    });
    if (res.ok) {
      notify(`Order ${orderNumber} updated to ${orderStatus}.`, "success");
      await loadCms();
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
        <div className="mx-auto max-w-xl px-4 text-center">
          <div className="rounded-[2rem] border border-[#dedbd2] bg-white p-10 shadow-sm">
            <ShieldAlert className="mx-auto h-10 w-10 text-[#d93829]" />
            <h1 className="mt-4 font-serif text-3xl font-semibold text-[#141413]">
              Curator / Admin Access Required
            </h1>
            <p className="mt-3 text-sm text-[#62605a]">
              Sign in with an administrator account to manage books, inventory, authors,
              coupons, and orders without editing code. (The first account registered on a
              fresh installation—or an email matching <code>ADMIN_SETUP_EMAIL</code>—is
              granted curator privileges.)
            </p>
            <Link
              href="/account"
              className="mt-6 inline-block rounded-full bg-[#141413] px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#d93829]"
            >
              Go to Account Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-grain min-h-screen bg-[#f6f5f0] pb-24 pt-28 text-[#141413]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-[#62605a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d93829]" />
            Publishing House CMS
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-[#141413]">
            Catalog, Inventory &amp; Order Console
          </h1>
          <p className="mt-2 text-sm text-[#62605a]">
            {books.length} books • {authors.length} authors • {coupons.length} coupons •{" "}
            {orders.length} orders
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-[#62605a]">Loading publishing records...</p>
        ) : (
          <div className="space-y-12">
            {/* Publish New Book + Create Coupon */}
            <div className="grid gap-8 lg:grid-cols-12">
              <form
                onSubmit={handlePublishBook}
                className="space-y-4 rounded-[2rem] border border-[#dedbd2] bg-white p-7 lg:col-span-7"
              >
                <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
                  <BookPlus className="h-5 w-5 text-[#d93829]" /> Publish New Book
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Book Title"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Author Name"
                    value={newBook.authorName}
                    onChange={(e) => setNewBook({ ...newBook, authorName: e.target.value })}
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  />
                  <select
                    value={newBook.category}
                    onChange={(e) =>
                      setNewBook({ ...newBook, category: e.target.value as BookCategory })
                    }
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  >
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="ISBN-13"
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Price (BDT)"
                    value={newBook.price}
                    onChange={(e) => setNewBook({ ...newBook, price: Number(e.target.value) })}
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Initial Stock"
                    value={newBook.stock}
                    onChange={(e) => setNewBook({ ...newBook, stock: Number(e.target.value) })}
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Short editorial description"
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#141413] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d93829]"
                >
                  Publish Book to Storefront
                </button>
              </form>

              <form
                onSubmit={handleCreateCoupon}
                className="space-y-4 rounded-[2rem] border border-[#dedbd2] bg-white p-7 lg:col-span-5"
              >
                <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
                  <Tag className="h-5 w-5 text-[#d93829]" /> Add / Update Coupon
                </h2>
                <input
                  type="text"
                  required
                  placeholder="Coupon Code (e.g. WINTER15)"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm uppercase"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newCoupon.type}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        type: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (৳)</option>
                  </select>
                  <input
                    type="number"
                    required
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    className="rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Description"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full rounded-xl border border-[#dedbd2] bg-[#f6f5f0] px-3.5 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#d93829] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#141413]"
                >
                  Save Coupon
                </button>
              </form>
            </div>

            {/* Inventory Table */}
            <section className="rounded-[2rem] border border-[#dedbd2] bg-white p-7">
              <h2 className="font-serif text-2xl font-semibold text-[#141413]">
                Inventory &amp; Pricing Control
              </h2>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#dedbd2] text-xs uppercase tracking-[0.14em] text-[#62605a]">
                    <tr>
                      <th className="py-3 pr-4">Title</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Price (৳)</th>
                      <th className="py-3 pr-4">Stock</th>
                      <th className="py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dedbd2]">
                    {books.map((b) => (
                      <InventoryRow
                        key={b.id}
                        book={b}
                        onSave={handleInventorySave}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Orders Table */}
            <section className="rounded-[2rem] border border-[#dedbd2] bg-white p-7">
              <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#141413]">
                <Package className="h-5 w-5 text-[#d93829]" /> Orders Fulfillment
              </h2>
              {orders.length === 0 ? (
                <p className="mt-4 text-sm text-[#62605a]">No orders placed yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dedbd2] bg-[#f6f5f0] p-4 text-sm"
                    >
                      <div>
                        <p className="font-mono font-bold text-[#141413]">
                          {ord.orderNumber}
                        </p>
                        <p className="text-xs text-[#62605a]">
                          {ord.customer.fullName} • {ord.customer.city} •{" "}
                          {formatPrice(ord.total)} ({ord.paymentMethod})
                        </p>
                      </div>
                      <select
                        value={ord.orderStatus}
                        onChange={(e) =>
                          void handleOrderStatus(
                            ord.orderNumber,
                            e.target.value as OrderStatus
                          )
                        }
                        className="rounded-xl border border-[#dedbd2] bg-white px-3 py-1.5 text-xs font-semibold"
                      >
                        {["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map(
                          (st) => (
                            <option key={st} value={st}>{st}</option>
                          )
                        )}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryRow({
  book,
  onSave,
}: {
  book: Book;
  onSave: (bookId: string, stock: number, price: number) => Promise<void>;
}) {
  const [stock, setStock] = useState(book.stock);
  const [price, setPrice] = useState(book.price);

  return (
    <tr>
      <td className="py-3 pr-4 font-serif text-base font-semibold text-[#141413]">
        {book.title}
      </td>
      <td className="py-3 pr-4 text-xs text-[#62605a]">{book.category}</td>
      <td className="py-3 pr-4">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-24 rounded-lg border border-[#dedbd2] bg-[#f6f5f0] px-2.5 py-1 text-xs"
        />
      </td>
      <td className="py-3 pr-4">
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="w-20 rounded-lg border border-[#dedbd2] bg-[#f6f5f0] px-2.5 py-1 text-xs"
        />
      </td>
      <td className="py-3">
        <button
          type="button"
          onClick={() => void onSave(book.id, stock, price)}
          className="rounded-full bg-[#141413] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#d93829]"
        >
          Save
        </button>
      </td>
    </tr>
  );
}

