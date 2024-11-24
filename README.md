MERN Stack Application with Vite
Welcome to the MERN Stack Application repository! This application leverages modern technologies like Vite for front-end development, Supabase for authentication, Google Vision API for document validation, and Brevo API for email communication.


Features
Front-end built with Vite and modern UI/UX using Mantine.
Back-end powered by Node.js and Express.
Authentication and database services using Supabase.
Document validation using Google Vision API (e.g., commercial invoices, certificates of origin, packing lists).
Email notifications via Brevo API.
Getting Started
Follow these steps to set up the project locally.

Prerequisites
Node.js: Ensure you have Node.js installed on your system. Download here.
Supabase Account: Sign up at Supabase.
Google Cloud Account: Create a project and enable the Google Vision API.
Brevo Account: Sign up at Brevo to generate your API key.
Clone the Repository
bash
Copy code
git clone https://github.com/<your-username>/<your-repository-name>.git
cd <your-repository-name>
Front-End Setup
Navigate to the front-end directory:
bash
Copy code
cd client
Install dependencies:
bash
Copy code
npm install
Create a .env file in the client directory and add your Supabase credentials:
makefile
Copy code
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_KEY=<your-supabase-key>
Start the development server:
bash
Copy code
npm run dev
Back-End Setup
Navigate to the back-end directory:
bash
Copy code
cd server
Install dependencies:
bash
Copy code
npm install
Create a .env file in the server directory and add the following keys:
makefile
Copy code
PORT=5000
GOOGLE_VISION_API_KEY=<your-google-vision-api-key>
BREVO_API_KEY=<your-brevo-api-key>
Start the back-end server:
bash
Copy code
npm start
Run the Application
Ensure both the front-end and back-end servers are running.
Open your browser and visit:
Front-End: http://localhost:5173
Back-End: http://localhost:5000
Built With
Front-End: React, Vite, Mantine
Back-End: Node.js, Express
Authentication: Supabase
APIs: Google Vision API, Brevo API
Database: MongoDB
Contributing
Contributions are welcome! Please follow these steps:

Fork the repository.
Create a new branch:
bash
Copy code
git checkout -b feature-name
Commit your changes:
bash
Copy code
git commit -m "Add your message here"
Push to the branch:
bash
Copy code
git push origin feature-name
Open a pull request.
License
This project is licensed under the MIT License. See the LICENSE file for details.

Acknowledgments
Vite
Mantine
Supabase
Google Vision API
Brevo
Feel free to reach out if you encounter any issues or have suggestions for improvement. 🎉
