# Phone Shop POS Software - Frontend
This is the frontend of a Point-of-Sale (POS) system designed for a phone shop. The system allows users to manage inventory (LCD screens, phone accessories) and handle transactions. The frontend communicates with two separate backend servers, making API requests via a centralized apiservice.js file. Additionally, it features AI-powered responses using the Gemini model for enhanced decision-making and suggestions.

# Features
Inventory Management: Manage inventory for phone accessories and LCD screens.
POS Transactions: Handle various Point-of-Sale transactions efficiently.
Responsive Design: Works seamlessly on both desktop and mobile devices.
PWA Support: Offers Progressive Web App functionality for mobile users.
AI-Powered Insights: Utilizes the Gemini model for enquiries from users.
Data Search: Leverages MeiliSearch for fast, full-text search across the data.
Role-Based UI: Dynamically adjusts UI components based on user roles.
Technologies Used
React: For building the user interface.
Vite: As the build tool for fast development.
Redux: For state management.
Chakra UI: For styling and UI components.
AWS Amplify: For hosting the application.
MeiliSearch: For fast, full-text search capabilities.
Gemini AI Model: For intelligent responses.

# Usage
The application is available as a web app hosted on AWS Amplify.
For mobile users, the app functions as a Progressive Web App (PWA) that can be installed directly from the browser for a more native experience.
All API requests are managed through the apiservice.js file.

# Role-Based UI and Sign-In
This POS software implements role-based access control using Firestore to manage user roles. The UI components displayed to the user are dynamically adjusted based on their assigned role.

# Firebase ID-Based Sign-In
The sign-in process utilizes Firebase ID-based authentication. The ID token is authenticated in the backend, where the UID is decoded. This UID is then used to determine whether to issue a JWT token, enabling secure access based on user roles.

# Security
Security measures are implemented in AWS Amplify with custom security headers, including:

Strict-Transport-Security
Content-Security-Policy
Cache-Control