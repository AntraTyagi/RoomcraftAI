# RoomcraftAI

An intelligent interior design platform powered by AI for room transformations and virtual staging.

## Project Structure

- **client**: React frontend application
- **server**: Node.js Express backend
- **db**: Database models and connections
- **mobile**: React Native mobile application

## Prerequisites

- Node.js (v18+)
- npm or yarn
- MongoDB database
- PostgreSQL database
- Replicate API key for AI models

## Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/roomcraftai

# MongoDB
MONGODB_URI=mongodb://localhost:27017/roomcraftai

# JWT
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Email (for verification)
GMAIL_USER=your_gmail_email
GMAIL_APP_PASSWORD=your_gmail_app_password

# AI Models
REPLICATE_API_KEY=your_replicate_api_key
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Run database migrations:

```bash
npm run db:push
```

3. Start the development server:

```bash
npm run dev
```

## AI Model Information

The application uses three Replicate AI models:
1. Design generation model: `adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38`
2. Inpainting model: `stability-ai/sdxl-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3`

## Authentication Flow

The application uses a dual authentication system:
- JWT tokens stored in localStorage
- Session-based authentication with cookies

## Credit System

- New users get 10 free credits after email verification
- Each design generation costs 1 credit
- Credits are deducted after successful operations

## Running the Mobile App (optional)

```bash
cd mobile
npm install
npx react-native run-ios  # For iOS
# or
npx react-native run-android  # For Android
```

## Deployment Considerations

When deploying to production:
1. Configure proper CORS settings in server/index.ts
2. Set up a production MongoDB database
3. Set up a production PostgreSQL database
4. Ensure email service is properly configured
5. Add rate limiting to API endpoints

## License

This project is proprietary and confidential.