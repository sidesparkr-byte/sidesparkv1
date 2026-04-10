```mermaid
flowchart TD
    A["Root App\n/Users/felipereyesmurcia/Documents/thesidespark/src/app/layout.tsx"] --> B["Auth Routes\nsrc/app/(auth)"]
    A --> C["Main App Shell\nsrc/app/(main)/layout.tsx"]
    A --> D["Global Middleware\nsrc/middleware.ts"]

    D --> E["Supabase Session Refresh\nsrc/lib/supabase/middleware.ts"]
    D --> F["Route Guards\nlogin / market / profile / messages"]

    B --> B1["Login\nsrc/app/(auth)/login/*"]
    B --> B2["Verify\nsrc/app/(auth)/verify/*"]
    B --> B3["Onboarding\nsrc/app/(auth)/onboarding/*"]
    B --> B4["Callback\nsrc/app/callback/route.ts"]

    C --> M["Market\nsrc/app/(main)/market/*"]
    C --> MSG["Messages\nsrc/app/(main)/messages/*"]
    C --> ACT["Activity\nsrc/app/(main)/activity/*"]
    C --> COF["Co-founders\nsrc/app/(main)/co-founders/*"]
    C --> PROF["Profile\nsrc/app/(main)/profile/*"]

    M --> MAPI["Market API\nsrc/app/api/market/route.ts"]
    M --> MSELL["Sell Flows\nsrc/app/(main)/market/sell/*"]
    M --> MLOOK["Looking For New\nsrc/app/(main)/market/looking-for/new/*"]
    M --> MHOUSE["Housing Detail\nsrc/app/(main)/market/housing/[id]/page.tsx"]

    MSG --> MSGSTART["Conversation Start\nsrc/app/messages/start/route.ts"]
    MSG --> REAL["Realtime Thread UI\nsrc/app/(main)/messages/[id]/thread-client.tsx"]

    ACT --> LAPI["Looking For API\nsrc/app/api/looking-for/*"]
    ACT --> ADMIN["Admin Looking For\nsrc/app/admin/looking-for/*"]

    COF --> COFAPI["Co-founder APIs\nsrc/app/api/cofounders/*"]

    C --> LAND["Landlord Flow\nsrc/app/landlords/*"]
    LAND --> LANDAPI["Legacy-named Publish API\nsrc/app/api/landlords/checkout-session/route.ts"]

    subgraph UI["UI Layer"]
      UI1["src/components/ui/*"]
    end

    subgraph LIB["Shared Logic"]
      S1["Supabase Clients\nsrc/lib/supabase/*"]
      S2["Media URL Resolver\nsrc/lib/media.ts"]
      S3["Nav Config\nsrc/lib/nav.ts"]
      S4["Feature Helpers\nsrc/lib/market/*\nsrc/lib/looking-for/*\nsrc/lib/cofounders.ts"]
      S5["Legacy Fee Logic\nsrc/lib/utils/fees.ts"]
    end

    subgraph DB["Supabase"]
      DB1["Auth"]
      DB2["Postgres Tables"]
      DB3["Storage Buckets\navatars, listing-photos"]
      DB4["Realtime\nmessages"]
      DB5["Migrations\nsupabase/migrations/*"]
    end

    B1 --> S1
    B2 --> S1
    B3 --> S1
    B4 --> S1

    M --> UI
    MSG --> UI
    ACT --> UI
    COF --> UI
    PROF --> UI

    M --> S2
    MSG --> S2
    PROF --> S2

    S1 --> DB1
    MAPI --> DB2
    LAPI --> DB2
    COFAPI --> DB2
    LANDAPI --> DB2
    REAL --> DB4
    B3 --> DB3
    MSELL --> DB3
    DB5 --> DB2

```