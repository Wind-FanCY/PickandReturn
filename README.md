# Pick and Return - Item Management System

A React-based web application for managing lent items log, checking return dates, and sending reminders.

## Features

- User authentication system
- Item management (add, delete, update)
- Reminder system for lender and borrower
- Responsive design
- Form validation
- Error handling

## Technical Stack

- Frontend: React
- Backend: Express.js
- Styling: CSS
- Build Tool: Vite

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Project Structure

- `src/` - Frontend React components and logic
- `server.js` - Express server setup
- `sessions-controller.js, item-controller.js` - Backend route handlers
- `sessions.js, users.js, items.js` - Data models and business logic

## Security Features

- Input validation main on backend
- Session-based authentication
- No password storage

## Licenses
I downloaded all the images from fonts.google.com.

- These icons I downloaded from  http://fonts.google.com/icons ( It is used under the Apache License 2.0: https://github.com/google/material-design-icons/blob/master/LICENSE):

  - `login_icon.png` -- I used it for login button.
  - `logout_icon.png `-- I used it for logout button.
  - `delete_icon.png` -- I used it for delete button.
  - `add_icon.png` -- I used it for add button.
  - `reminder_icon.png` -- I used it for reminder button.

## Implemented Bonus Requirements

### Extra Service Interaction Complexity
- Additional HTTP methods (4): server.js
#### Session Management
- `GET /api/v1/session` - Get current session status
- `POST /api/v1/session` - Login user
- `DELETE /api/v1/session` - Logout user

#### Item Management
- `GET /api/v1/items` - Get all items for current user
- `POST /api/v1/items` - Add new item
- `POST /api/v1/items/:id` - Send reminder for specific item
- `PATCH /api/v1/items/:id` - Update item status
- `DELETE /api/v1/items/:id` - Delete item

### Extra State Complexity
- Different "pages": MainContent.jsx, LoginForm.jsx
  - Items page
  - Notices page
  - Login page

### Separation of Concerns
- Distinct data models: sessions.js, items.js, users.js
- Separate controllers: item-controller.js, sessions.js
- Isolated services: services.js
- Use createContext for prop-drilling: app-context.js

### UseReducer and useContext Implementation
- Complex state management: reducer.js
  - Login state
  - Items state
  - Page state
  - Error handling

## Notes

- No external CSS frameworks used
- No client-side storage except for session cookie
- All services return JSON
- Semantic HTML and CSS class names used throughout
```

