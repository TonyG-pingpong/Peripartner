# Buy PDF – concise workflow

## Short flow (5 steps)

1. **Customer** visits your site → clicks **Buy this**
2. **Checkout page** → customer clicks **Pay** → goes to **Gumroad**
3. **Customer pays** on Gumroad → Gumroad sends **webhook** to your backend (buyer email + name)
4. **Backend** creates watermarked PDF + **one-time 24h link** → returns link (e.g. for thank-you page or email)
5. **Customer** opens link → **downloads PDF once** → link expires

---

## Flowchart

```mermaid
flowchart LR
    subgraph Customer
        A[Product page] --> B[Checkout page]
        B --> C[Gumroad pay]
        C --> D[Get download link]
        D --> E[Download PDF once]
    end

    subgraph Your backend
        F[Webhook receives sale]
        G[Watermark PDF]
        H[Create one-time link]
        F --> G --> H
    end

    C -.->|POST buyer email| F
    H -.->|Return URL| D
```

---

## Same flow (top to bottom)

```mermaid
flowchart TD
    Start([Customer on your site]) --> Buy[Click Buy this]
    Buy --> Checkout[Your checkout page]
    Checkout --> Pay[Click Pay → Gumroad]
    Pay --> Gumroad[Customer pays on Gumroad]
    Gumroad --> Webhook[Gumroad POSTs to your backend]
    Webhook --> Backend[Backend: watermark PDF + create 24h one-time link]
    Backend --> Link[Customer gets link]
    Link --> Download[Customer opens link → PDF downloads once]
    Download --> End([Done])
```

---

## One-line summary

**Customer → Buy this → Pay on Gumroad → Backend gets webhook → Watermarked PDF + one-time link → Customer downloads once.**
