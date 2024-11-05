# User Management Service

This project is a user management service developed with **Express** and **TypeScript**, utilizing **Prisma** for database management.

## Features

- **Express.js** with **TypeScript** for server development
- **Prisma** as the ORM for database management
- Security enhancements with **Helmet** and **Express Rate Limit**
- Testing and validation using **Jest**
- Environment management with **dotenv**

## Requirements

- **Node.js** version 20
- **npm** (Node Package Manager)

## Installation

### Step 1: Setup the `.env.dev`
- Create a `.env.dev` file by copying from `.env.example`:

   ```bash
   cp .env.example .env.dev
   ```

### Step 2: Install Dependencies
- Install all necessary libraries using the following command:

   ```bash
   npm install
   ```

### Step 3: Initialize the Database Schema
- Run the migration to set up the database tables and structure:

   ```bash
   npm run migrate
   ```

### Step 4: Seed Initial Data
- Populate the database with initial data by running:

   ```bash
   npm run seed
   ```

### Step 5: Update Database Interfaces (If Necessary)
- If interfaces from the database are missing, update them by running:

   ```bash
   npm run update:type
   ```

### Step 6: Start the Server
- Start the server in development mode:

   ```bash
   npm run dev
   ```

## Testing

This project uses **Jest** for unit and integration testing.

### Run All Tests

   ```bash
   npm run test:all
   ```

### Run Unit Tests

   ```bash
   npm run test:unit
   ```

### Run Unit Tests with Coverage

   ```bash
   npm run test:unit-cov
   ```

### Run Integration Tests

   ```bash
   npm run test:integration
   ```

## Code Management
### Linting and Fixing Code Issues
#### Check the code for issues using ESLint:

   ```bash
   npm run lint
   ```

#### Automatically fix detected issues:

   ```bash
   npm run eslint:fix
   ```

## Code Formatting with Prettier
#### Check code formatting:

   ```bash
   npm run prettier
   ```

#### Format the code:

   ```bash
   npm run format
   ```

## How to build and run production mode

#### Format the code and Check the code for issues using ESLint:

   ```bash
   npm run prebuild
   ```

#### Create a project for production:

   ```bash
   npm run build
   ```

#### Run the server in production mode:

   ```bash
   npm run start
   ```

## How to create an image and run a container

#### Create and Run Containers

   ```bash
   docker-compose --env-file .env.prod up -d
   ```

#### Stop and Remove Running Containers

   ```bash
   docker-compose --env-file .env.prod down
   ```