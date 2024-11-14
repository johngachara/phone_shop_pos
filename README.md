# 📱 Phone Shop POS Software - Frontend

This is the frontend of a Point-of-Sale (POS) system designed for a phone shop. The system enables efficient management of inventory (e.g., LCD screens and phone accessories) and handles a range of POS transactions. The frontend interacts with two separate backend servers and incorporates AI-powered responses using the OpenAI GPT-4 model for inquiries and recommendations.

## Features

- **Inventory Management**: Easily manage stock for phone accessories, LCD screens, and other items.
- **POS Transactions**: Streamlined processing of Point-of-Sale transactions.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **PWA Support**: Operates as a Progressive Web App (PWA), allowing mobile users to install it directly from the browser for a more native experience.
- **AI-Powered Insights**: Uses OpenAI’s GPT-4 model for real-time insights and responses.
- **Data Search**: Integrates MeiliSearch for fast, full-text search across data.
- **Role-Based UI**: Adjusts UI components based on user roles for a personalized experience.

## Technologies Used

- **React**: For building the user interface.
- **Vite**: Fast development and build tool.
- **Zuhan**: State management library, with components connected to dedicated Zuhan stores.
- **Chakra UI**: For styling and responsive UI components.
- **AWS Amplify**: Used for hosting the application.
- **MeiliSearch**: Enables fast, full-text search capabilities.
- **OpenAI GPT-4 Model**: Provides intelligent responses and recommendations through free model inference on GitHub.

## Usage

The application is accessible as a web app hosted on AWS Amplify. Mobile users can install the app as a **Progressive Web App (PWA)** from the browser, creating a more app-like experience.

Each component has its own Zuhan store, which manages the state and handles API requests directly, avoiding the need for a centralized `apiservice.js` file.

## Role-Based UI and Sign-In

This POS software incorporates **role-based access control** through Firebase, dynamically adjusting UI components based on user roles.

### Firebase ID-Based Sign-In

Sign-in is managed via **Firebase ID-based authentication**. The Firebase ID token is validated on the backend, where the UID is decoded to determine if a JWT token should be issued for secure access.

## Security

Security measures implemented in AWS Amplify include custom security headers:

- **Strict-Transport-Security (HSTS)**: Enforces secure connections to the server.
- **Content-Security-Policy (CSP)**: Helps prevent a wide range of attacks by defining what resources can be loaded.
- **Cache-Control**: Configured for optimal performance and security.

---
