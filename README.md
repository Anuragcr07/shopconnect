This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# ShopConnect

ShopConnect is a location-based marketplace platform that connects customers with nearby local shopkeepers. Instead of visiting multiple stores to find a product or service, customers can post their requirements and receive responses from relevant shops in their area.

The platform combines real-time communication, location-based discovery, mapping services, and marketplace functionality to make local shopping more convenient and efficient.

## Live Demo

[ShopConnect - Live Application](https://shopconnect-2.onrender.com/)

## GitHub Repository

[ShopConnect on GitHub](https://github.com/Anuragcr07/shopconnect)

---

## Features

### Customer Features

* Create and manage product requirements
* Discover nearby shops based on location
* Send requirements to relevant shopkeepers
* Receive responses from shopkeepers
* Communicate with shopkeepers through the integrated chat system
* View shop locations on an interactive map
* Get route and distance information
* Manage profile and account information

### Shopkeeper Features

* Create and manage shop profiles
* View customer requirements
* Respond to relevant customer requests
* Communicate with customers through chat
* Manage shop location and business information
* Reach customers within a specified geographic radius

### Location-Based Search

ShopConnect uses geolocation to identify relevant shops near a customer.

The application integrates location and mapping technologies to provide:

* Nearby shop discovery
* Geographic filtering
* Distance-based search
* Interactive maps
* Route visualization
* Location-based marketplace matching

### Real-Time Communication

The platform includes a chat system that allows customers and shopkeepers to communicate after a request has been created.

Users can:

* Start conversations
* Exchange messages
* View conversation history
* Communicate regarding product availability and requirements

### Authentication and Authorization

The application provides user authentication and role-based access control.

Authentication-related technologies include:

* NextAuth.js
* Prisma
* MongoDB
* bcrypt

---

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* React Leaflet
* Leaflet
* Swiper
* Lucide React
* Anime.js

### Backend

* Next.js API Routes
* Node.js
* TypeScript

### Database

* MongoDB
* Prisma ORM

### Authentication

* NextAuth.js
* Prisma Adapter
* bcrypt.js

### Location and Maps

* Google Maps JavaScript API
* Leaflet
* OpenStreetMap
* GeoJSON

### Caching and Geospatial Data

* Upstash Redis

Redis is used for efficient location-based operations and caching.

### Cloud and Storage

* AWS S3
* Cloudinary

### Email and Communication

* Nodemailer
* Resend

### Deployment

* Render

---

## Architecture

The application follows a modern full-stack Next.js architecture.

```text
                    +----------------------+
                    |       Customer       |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |     Next.js App      |
                    |   React + TypeScript |
                    +----------+-----------+
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       +-------------+   +-------------+  +-------------+
       |   Prisma    |   |    Redis    |  | Maps APIs   |
       |    ORM      |   |  / Upstash  |  | Google /    |
       +------+------+   +-------------+  | Leaflet     |
              |                           +-------------+
              v
       +-------------+
       |   MongoDB   |
       +-------------+

              |
              v
       +-------------+
       | Shopkeeper  |
       +-------------+
```

---

## How It Works

### 1. Customer Creates a Requirement

A customer can create a post describing the product or service they are looking for.

### 2. Location-Based Matching

The customer's location is used to identify shops operating within the relevant geographic area.

### 3. Shopkeepers Receive Requests

Nearby shopkeepers can view customer requirements and respond if they can fulfill them.

### 4. Customer Compares Responses

The customer can review responses from different shopkeepers and communicate with them.

### 5. Communication

Customers and shopkeepers can continue the conversation through the integrated messaging system.

### 6. Location and Navigation

The application provides map-based information to help users identify shop locations and routes.

---

## Project Structure

```text
shopconnect/
│
├── prisma/
│   └── schema.prisma
│
├── public/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git

### Clone the Repository

```bash
git clone https://github.com/Anuragcr07/shopconnect.git
```

Navigate to the project directory:

```bash
cd shopconnect
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory.

Example:

```env
DATABASE_URL="your_mongodb_connection_string"

NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

UPSTASH_REDIS_REST_URL="your_upstash_redis_url"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token"

CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="your_aws_region"
AWS_S3_BUCKET_NAME="your_bucket_name"

RESEND_API_KEY="your_resend_api_key"
```

Do not commit your `.env` file or any API keys, database credentials, or secrets to GitHub.

### Generate Prisma Client

```bash
npx prisma generate
```

### Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Production Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

The project's build configuration automatically runs Prisma generation before the Next.js production build.

---

## Deployment

The application is deployed using Render.

### Live Application

https://shopconnect-2.onrender.com/

For deployment, configure the required environment variables in the Render dashboard before building the application.

The production build command is:

```bash
npm run build
```

The start command is:

```bash
npm start
```

---

## Key Highlights

* Full-stack marketplace application
* Location-based shop discovery
* Customer-to-shopkeeper marketplace model
* Geographic filtering using Redis
* Interactive maps and route visualization
* Real-time-style messaging system
* Authentication and role-based access
* MongoDB database with Prisma ORM
* Cloud-based image and file handling
* Google Maps and Leaflet integration
* Responsive user interface
* Production deployment on Render

---

## Future Improvements

* Online payment integration
* Order management and tracking
* Shop ratings and reviews
* Advanced recommendation system
* Push notifications
* Improved real-time messaging using WebSockets
* AI-powered product and shop recommendations
* Advanced analytics for shopkeepers
* Inventory management
* Mobile application

---

## Author

### Anurag

B.E. Information Technology
UIET, Panjab University

GitHub: [Anuragcr07](https://github.com/Anuragcr07)

---

## License

This project is intended for educational and portfolio purposes.
