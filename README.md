# CrossSync
 
A modern, end‑to‑end freight collaboration platform that connects exporters (sellers) and carriers to plan, book, track, and complete international shipments with confidence.
 
## Problem Statement
- Fragmented handoffs between sellers and carriers create delays, hidden costs, and errors.
- Paperwork and compliance (invoices, origin certificates, packing lists) are time‑consuming and error‑prone.
- Live shipment visibility is limited, making exceptions hard to manage.
- Currency differences and cross‑border complexity slow decisions and increase risk.
 
## Solution Overview
- Intelligent shipment requests: Sellers specify products, dimensions/weight, origin and destination ports in minutes.
- Carrier marketplace & bidding: Carriers browse live opportunities and submit competitive bids; sellers choose the best fit.
- Real‑time collaboration: Built‑in chat for each shipment keeps context, decisions, and files together.
- Document automation: Upload trade documents and auto‑validate with Vision AI to reduce compliance mistakes.
- Route planning you can see: Explore ocean routes on an interactive map before confirming.
- In‑transit visibility: Optional vessel tracking overlay with weather layers to anticipate risks earlier.
- Smarter decisions with currency conversion: Compare bids in your preferred currency instantly.
- Trusted updates: Email alerts and live status changes keep both sides aligned.
- Secure access & roles: Authentication and role‑based views for sellers and carriers.
 
## Target Users
- Exporters/SMBs wanting faster, error‑free shipments and better carrier coverage.
- Freight carriers and forwarders looking to keep capacity filled and win high‑quality loads.
- Operations teams seeking a single source of truth across messages, bids, documents, and tracking.
 
## Workflow Overview
1. Seller creates a shipment with product details and ports; the platform suggests/plans feasible routes.
2. Carriers discover the shipment and place bids (with currency conversion support).
3. Seller accepts a bid; both parties get a dedicated chat and document space.
4. Trade documents are uploaded and validated; shipment moves through verification → dispatch → in‑transit → completed.
5. Optional vessel location and weather overlays provide context for ETAs and exception handling.
6. Notifications and real‑time updates keep everyone synchronized.
 
## Business Benefits
- Faster bookings and fewer emails back‑and‑forth.
- Lower cost through transparent, competitive bids.
- Fewer document errors and compliance issues.
- Earlier risk detection with mapping, tracking, and weather context.
- A complete, auditable trail of messages, files, and status changes per shipment.
 
---
 
## Quick Start
Keep it simple—run the server and the client.
 
Prerequisites
- Node.js 18+ and npm
- A MongoDB connection string (local Atlas or self‑hosted)
 
1) Configure environment
- Server `server/.env` (minimal example):
```
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
HOST_ADDRESS=http://localhost:5173
BREVO_API_KEY=<brevo_smtp_key>
EMAIL_TEMPLATE=<from_email@example.com>
GOOGLE_API_KEY=<google_cloud_vision_api_key>
# Optional, if you enable these features
SUPABASE_URL=<supabase_url>
SUPABASE_ANON_KEY=<supabase_anon_key>
EXCHANGE_RATE_API_KEY=<exchange_rate_api_key>
AWS_REGION=<region>
AWS_ACCESS_KEY_ID=<aws_key_id>
AWS_SECRET_ACCESS_KEY=<aws_secret>
AWS_S3_BUCKET=<bucket_name>
```

- Client `client/.env` (minimal example):
```
VITE_API_URL=http://localhost:4000
VITE_CLERK_PUBLISHABLE_KEY=<clerk_publishable_key>
VITE_SUPABASE_URL=<supabase_url>
VITE_SUPABASE_KEY=<supabase_anon_key>
VITE_SEAROUTES_API_KEY=<searoutes_api_key>
```

Notes
- Some optional features (e.g., vessel tracking overlays) require additional API keys. Configure them if you plan to use those features.
- Never commit secrets to version control.

2) Install dependencies
- In `server/`: `npm install`
- In `client/`: `npm install`

3) Run locally (two terminals)
- In `server/`: `npm start` (runs on port 4000)
- In `client/`: `npm run dev` (opens on http://localhost:5173)

4) Try it
- Sign up/sign in, choose your role (seller or carrier), and:
  - Sellers: create a shipment, upload documents, and review carrier bids.
  - Carriers: browse shipments, place bids, and collaborate in real‑time.

---

## Product Status
This project showcases a practical, user‑centric workflow for cross‑border shipping. Real‑time chat, document automation, mapping, and notifications are designed to reduce friction, improve trust, and accelerate every shipment from request to delivery.

## Integrations
- Authentication & accounts: Clerk for secure sign‑in and role‑based access
- Chat & collaboration: Supabase Realtime; optional TalkJS for rich 1:1 chats
- Document automation: Google Vision API (text/document detection) to validate trade docs
- Mapping & routing: OpenLayers/Leaflet with Searoutes API for sea route planning
- Weather overlays: OpenWeatherMap tiles for temperature and wind context
- Storage: Supabase Storage for shipment files; AWS S3 for carrier documents
- Notifications: Brevo (Sendinblue) for email updates
- Payments (optional): Hathor wallet integration for confirmations and payouts

## Security & Privacy
- Secrets live in environment variables; never commit keys to version control.
- In production, prefer private buckets and signed URLs for file access.
- Review bucket/object ACLs; sample code uses public access for simplicity—tighten this before going live.
- Limit CORS origins to your client app domain.
- Store only necessary personal data and minimize logging of sensitive information.

## Roadmap
- Role‑based analytics and shipment performance insights
- Deeper document parsing and automated compliance checks
- Proactive alerts (ETA risk, severe weather, port congestion)
- E‑signing for commercial documents and standardized templates
- Multi‑currency invoicing, settlements, and payouts
- Webhooks and connectors to ERP/TMS systems

## FAQ
- Who is it for? Exporters/SMBs and freight carriers/forwarders collaborating on international shipments.
- Do I need API keys to run it? Yes. Core setup needs a database URL and client/server URLs; optional features (routing, weather, S3, email, Vision) require their respective keys.
- Does it support air/road? The collaboration flow is mode‑agnostic; the included mapping demo focuses on sea.
- How are documents stored? Shipment files can use Supabase Storage; carrier docs can use AWS S3. Use private buckets and signed URLs in production.
- Is there a mobile app? The web app is responsive; native apps can be added later.
- Can I export my data? Exports can be added from the backend—open an issue to prioritize it.

## Feedback & Support
- Open an issue or start a discussion in this repository.
- For product questions or collaborations, contact the maintainers (add your email or link).

## Use Cases
- Quote to booking in minutes: Create a shipment, collect bids, and confirm the best offer in a single session.
- Document‑ready shipments: Upload core trade docs (invoice, packing list, origin certificate) and reduce back‑and‑forth.
- Transparent collaboration: Keep all messages and files tied to each shipment for easy auditing.
- Risk‑aware tracking: Visualize routes with weather overlays to anticipate delays and plan alternatives.
- Cross‑currency decisions: Compare and normalize bids to your preferred currency.

