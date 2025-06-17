# NeoInbox

## Overview
This Bachelor's Thesis focuses on the development of a web application aimed at automating tasks based on incoming emails received in Gmail. The automation is implemented through a system of macros, user configurable actions that are triggered by Gmail labels.

Thanks to Gmail filters, users can automatically tag incoming emails, enabling seamless integration with the macro system and optimizing routine actions in both personal and professional settings.

The platform provides an intuitive interface from which users can view and manage macros, as well as enable or disable mailbox monitoring according to their preferences.

The implementation uses Angular 19 for the front-end and Node.js with Express for the back-end, integrating Gmail, Google Drive, Google Calendar, and Google Docs APIs, along with several Google Cloud services such as Pub/Sub, Cloud Functions, Firebase Authentication, and Firestore, a NoSQL database.

## Project Structure

The project is divided into two main components:

- Backend (cloud-functions)
- Frontend (angular-web)

---

## Installation

### Prerequisites
- Node.js (v22 or higher)
- Angular CLI

### Backend Setup
```bash
# Navigate to cloud functions directory
cd cloud-functions

# Install dependencies
npm install

# Ask for the private folder with necessary credentials: (service accounts and enviroment file)
contact to 'drd733@alumnos.unican.es' or 'daavid.dev@gmail.com'

# Start running the server in local
npm run start
```

### Frontend Setup
```bash
# Navigate to Angular project
cd angular-web

# Install dependencies
npm install

# Serve the application locally
ng serve

---

# To use the API on the cloud

# Ask for the private folder with necessary credentials: (enviroment file)
contact to 'drd733@alumnos.unican.es' or 'daavid.dev@gmail.com'

# Change the BASE_URL of the api calls in Endpoints enum file
./angular-web/src/app/enums/EndPoints.ts
```

## Testing
```bash
# Server and web must be running 
cd cloud-functions
npm run start

cd angular-web
ng serve

# --- cloud functions ---

npx jest ./*


# --- angular web ---

# Run Unitary tests (with coverage checking)
ng test --code-coverage

# Run e2e tests
npm run cypress:run

# Run e2e tests in interactive mode
npm run cypress:open
```


## Documentation

You can check the API documentation by accessing to `localhost:5001/docs/` while running the server in local.

## License

This project is licensed under the MIT License.

## Author

David Ruiz del Corro - Bachelor's Final Project at University of Cantabria
