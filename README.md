# 🏛️ Uttoron Prokasoni — Immersive 3D Publishing House & Online Bookstore

<div align="center">

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-141413?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-087EA4?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.187-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-14.12-FF0055?style=for-the-badge&logo=framer&logoColor=white)](https://motion.dev/)

<br />

**An Awwwards-inspired, architectural 3D digital publishing house and online bookstore crafted with the sunlit plaster museum aesthetic of *Minimaze Light*.**

*“Stories That Shape Worlds.”*

[Explore Live Experience](#-interactive-3d-experience) • [Architecture Diagrams](#-system-architecture) • [Setup Guide](#-quick-start) • [Database & Schema](#-database-schema)

</div>

---

## 🎨 Visual Identity & Color Palette (*Minimaze Light*)

The design language moves away from generic e-commerce templates into a sunlit modernist museum exhibition:

| Swatch | Color Name | Hex Code | Purpose |
| :---: | :--- | :--- | :--- |
| ![#F6F5F0](https://via.placeholder.com/20/F6F5F0/000000?text=+) | **Gallery Plaster** | `#F6F5F0` | Sunlit museum walls & paper background |
| ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/000000?text=+) | **Pure Surface** | `#FFFFFF` | Lit pedestal surfaces, modal sheets & plinths |
| ![#ECEAE3](https://via.placeholder.com/20/ECEAE3/000000?text=+) | **Limestone Neutral** | `#ECEAE3` | Architectural niches, badges & soft accents |
| ![#DEDBD2](https://via.placeholder.com/20/DEDBD2/000000?text=+) | **Stone Hairline** | `#DEDBD2` | Museum framing, borders & wire dividers |
| ![#141413](https://via.placeholder.com/20/141413/FFFFFF?text=+) | **Gallery Ink** | `#141413` | Deep typography, headings & primary CTAs |
| ![#62605A](https://via.placeholder.com/20/62605A/FFFFFF?text=+) | **Archival Muted** | `#62605A` | Editorial captions, ISBNs & descriptions |
| ![#D93829](https://via.placeholder.com/20/D93829/FFFFFF?text=+) | **Vermilion Accent** | `#D93829` | Interactive cursor dot, badges & highlights |
| ![#B08B46](https://via.placeholder.com/20/B08B46/FFFFFF?text=+) | **Muted Brass** | `#B08B46` | Foil imprints & archival awards |

---

## 🏛️ Interactive 3D Experience

```
                   [ 3D EXHIBITION HALL 01 ]
                              │
                    (Scroll Down Corridor)
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        [ Recessed Niche A ]        [ Recessed Niche B ]
        - Floating 3D Book          - Floating 3D Book
        - Hover Spotlight           - Hover Spotlight
        - Wall Gallery Plaque       - Wall Gallery Plaque
                └─────────────┬─────────────┘
                              │
                    ( 90° Right Corner Turn )
                              │
                              ▼
                   [ 3D EXHIBITION WING 02 ]
                     - New Arrivals Plinth
                     - Collector Editions Showcase
                     - Interactive Inspection Zoom
```

- **L-Shaped 3D Hallway**: Scroll-driven camera transitions through a sunlit white plaster corridor (`HALL 01` turning into `WING 02`).
- **Recessed Wall Niches**: Soft spotlit alcoves featuring floating 3D books that respond to mouse cursor tilt and hover.
- **Scroll Memory ("Back on the Same Spot")**: Returning from book detail pages automatically restores exact scroll progress.
- **Pull-Down Paper Blind Menu**: Floating navigation with cursor-following `#D93829` vermilion dot.
- **Index View with Live 3D Hover Preview**: Toggle between catalog grid and archival table with sticky cover follow.
- **Interactive About Drum**: Rotating 3D hexagonal craft drum and editorial board portraits with overhead gallery lamps.

---

## 📊 System Architecture

### 1. High-Level Architecture Flowchart

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Browser)"]
        UI["Next.js 16 App Router UI"]
        ThreeCanvas["Three.js 3D Gallery & Book Viewer"]
        FramerUI["Framer Motion Micro-Interactions"]
        Cart["Persistent Cart & Session Store"]
    end

    subgraph AuthLayer ["Identity & Security"]
        FirebaseAuth["Firebase Auth (Google & Email)"]
        AdminSDK["Firebase Admin SDK (Token Verification)"]
    end

    subgraph Backend ["Next.js Server API Routes"]
        ApiBooks["/api/books (Catalog & Search)"]
        ApiOrders["/api/orders (Inventory & Order Engine)"]
        ApiAuth["/api/auth/firebase (User Sync)"]
        ApiPayments["/api/payments (bKash / Nagad / Card)"]
    end

    subgraph DataLayer ["Database & Cloud Infrastructure"]
        Postgres[(Supabase PostgreSQL)]
        PrismaORM["Prisma ORM (ACID Transactions)"]
        LocalFallback["JSON Fallback Store"]
    end

    UI --> ThreeCanvas
    UI --> FramerUI
    UI --> Cart

    UI -- "Google 1-Click" --> FirebaseAuth
    FirebaseAuth -- "ID Token" --> ApiAuth
    ApiAuth --> AdminSDK
    AdminSDK --> PrismaORM

    Cart -- "Place Order" --> ApiOrders
    ApiOrders --> PrismaORM
    PrismaORM --> Postgres

    ApiBooks --> PrismaORM
    PrismaORM -.->|If Disconnected| LocalFallback
```

---

### 2. E-Commerce Order Lifecycle (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Reader as 👤 Reader / Customer
    participant Store as 🖥️ Storefront & Cart
    participant API as ⚡ /api/orders
    participant DB as 🐘 PostgreSQL (Prisma)
    participant Gateway as 💳 Payment Gateway

    Reader->>Store: Add 3D Book to Cart
    Reader->>Store: Apply Coupon (e.g. LIBRARY10)
    Store->>Store: Auto-calculate Dhaka/Outside Delivery
    Reader->>Store: Proceed to Checkout & Submit
    Store->>API: POST /api/orders (payload & items)
    
    critical Atomic Transaction
        API->>DB: Check Stock & Verify Pricing
        API->>DB: Decrement Book Stock
        API->>DB: Create Order & OrderItems
    end
    
    alt Payment is COD (Cash on Delivery)
        API-->>Store: Return Confirmed Order ID
        Store-->>Reader: Instant Order Confirmation & Tracking
    else Payment is Online (bKash / Nagad / Card)
        API->>Gateway: Request Secure Checkout Session
        Gateway-->>API: Return Official Redirect URL
        API-->>Store: Redirect Reader to Gateway
        Reader->>Gateway: Complete Payment
        Gateway-->>API: Webhook / Callback Verification
        API->>DB: Update PaymentStatus to PAID
        API-->>Reader: Order Confirmed
    end
```

---

### 3. Feature Matrix Chart

```mermaid
pie title Features Distribution
    "Interactive 3D Environments (Three.js)" : 30
    "E-Commerce & Inventory (PostgreSQL/Prisma)" : 25
    "Identity & Auth (Firebase)" : 15
    "Editorial Storytelling & Motion" : 15
    "Payment Integration (bKash/Nagad/Cards)" : 15
```

---

## 🗄️ Database Schema

The production relational schema is defined in [`prisma/schema.prisma`](file:///d:/Uttoron_prokasoni/prisma/schema.prisma):

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ ADDRESS : saves
    AUTHOR ||--|{ BOOK : writes
    BOOK ||--o{ REVIEW : receives
    ORDER ||--|{ ORDER_ITEM : contains
    BOOK ||--o{ ORDER_ITEM : ordered_as

    USER {
        string id PK
        string firebaseUid UK
        string email UK
        string name
        string role
        string_array wishlist
    }

    BOOK {
        string id PK
        string slug UK
        string title
        string isbn UK
        string category
        float price
        int stock
        float rating
        json coverPalette
    }

    AUTHOR {
        string id PK
        string slug UK
        string name
        string roleTitle
        string bio
    }

    ORDER {
        string id PK
        string orderNumber UK
        string customerName
        string paymentMethod
        string paymentStatus
        string orderStatus
        float total
    }

    ORDER_ITEM {
        string id PK
        string bookId FK
        int quantity
        float unitPrice
        float lineTotal
    }
```

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```powershell
git clone https://github.com/your-username/uttoron_prokasoni.git
cd uttoron_prokasoni
npm install
```

### 2. Configure Environment Variables
Copy [.env.example](file:///d:/Uttoron_prokasoni/.env.example) to `.env.local`:
```powershell
cp .env.example .env.local
```
Fill in your credentials:
```env
# Supabase / PostgreSQL Connection
DATABASE_URL="postgresql://postgres.omcmvdsfxcibslubojng:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="uttornprokashoni.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="uttornprokashoni"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="uttornprokashoni.firebasestorage.app"
```

### 3. Sync & Seed Database
Push tables and seed initial archival books, authors, and coupons:
```powershell
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```powershell
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev --webpack` | Launches development server |
| `npm run build` | `next build --webpack` | Builds optimized production bundle |
| `npm run start` | `next start` | Runs production server |
| `npm run typecheck` | `tsc --noEmit` | Strict TypeScript type validation |
| `npm run db:push` | `prisma db push` | Pushes Prisma schema to PostgreSQL |
| `npm run db:seed` | `tsx prisma/seed.ts` | Populates database with seed catalog |

---

## 🛡️ License

Crafted with care by the **Uttoron Prokasoni** Creative Engineering Team.  
All book artwork, 3D presentations, and literary selections are protected under archival publishing copyright.

