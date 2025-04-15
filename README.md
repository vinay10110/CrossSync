# CrossSync - Maritime Logistics Platform

CrossSync is a comprehensive maritime logistics platform that connects sellers and carriers for efficient shipment management across international waters. The platform facilitates real-time tracking, secure communication, and seamless coordination between parties involved in maritime shipping operations.

## Features

- **User Role Management**
  - Separate interfaces for sellers and carriers
  - Secure authentication using Clerk
  - Role-based access control

- **Shipment Management**
  - Create and manage shipment requests
  - Real-time shipment tracking
  - Route optimization using SeaRoutes API
  - Document verification using Google Vision API
  - Weather information integration

- **Communication**
  - Real-time chat system using Socket.IO
  - Document sharing
  - Notifications for important updates

- **Payment Integration**
  - Secure payment processing using Hathor Network
  - Transaction history tracking
  - Multi-currency support

- **Interactive Maps**
  - Port selection with worldwide coverage
  - Route visualization using OpenLayers
  - Real-time weather overlay

## Technology Stack

### Frontend
- React 18 with Vite
- Mantine UI Components
- React Router for navigation
- Socket.IO for real-time communication
- OpenLayers for map visualization
- Clerk for authentication
- Supabase for data storage

### Backend
- Node.js with Express
- MongoDB for database
- Socket.IO for WebSocket connections
- Google Vision API for document verification
- SeaRoutes API for maritime routing
- Brevo for email notifications

## Getting Started

### Prerequisites
- Node.js 16 or higher
- MongoDB
- Supabase account
- Clerk account

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github/vinay10110/CrossSync
\`\`\`

2. Install dependencies for both frontend and backend
\`\`\`bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
\`\`\`

### Configuration

#### Frontend Environment Variables (.env)
\`\`\`
VITE_API_URL='YOUR_BACKEND_URL'
VITE_SUPABASE_URL='SUPABASE_URL'
VITE_SUPABASE_KEY='SUPABASE_KEY'
VITE_CLERK_PUBLISHABLE_KEY='YOUR_CLERK_KEY'
VITE_SEAROUTES_API_KEY='YOUR_SEAROUTES_KEY'
\`\`\`

#### Backend Environment Variables (.env)
\`\`\`
MONGO_URL='MONGODB_URL'
HOST_ADDRESS='YOUR_FRONTEND_URL'
BREVO_API_KEY='YOUR_BREVO_API_KEY'
GOOGLE_API_KEY='YOUR_GOOGLE_API_KEY'
EMAIL_TEMPLATE='YOUR_EMAIL'
SUPABASE_URL='YOUR_SUPABASE_URL'
SUPABASE_ANON_KEY='YOUR_SUPABASE_KEY'
\`\`\`

### Running the Application

1. Start the frontend development server
\`\`\`bash
cd client
npm run dev
\`\`\`

2. Start the backend server
\`\`\`bash
cd server
npm test
\`\`\`

The application will be available at `http://localhost:3000`

## Key Features in Detail

### For Sellers
- Create shipment requests with detailed cargo information
- Browse and select carriers
- Track shipment status in real-time
- Communicate with carriers
- Manage payments and documentation

### For Carriers
- Browse available shipment requests
- Submit bids for shipments
- Update shipment status and location
- Manage fleet and documentation
- Receive real-time notifications

## Support

For support and queries, please create an issue in the repository or contact the development team.

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## Acknowledgments

- [Mantine UI](https://mantine.dev) - For the comprehensive UI component library
- [Google Vision API](https://cloud.google.com/vision/docs) - For document verification
- [Brevo](https://developers.brevo.com/) - For email services
- [Supabase](https://supabase.com/docs) - For database and real-time features
- [SeaRoutes API](https://www.searoutes.com/) - For maritime routing
- [OpenLayers](https://openlayers.org/) - For map visualization
- [Clerk](https://clerk.com/) - For authentication and user management

