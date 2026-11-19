# RapidDispatch – Live Ops (Sprint 19)



### 1. Project Planning and Architecture

```text
Act as a senior full-stack software engineer.

Build a real-time RapidDispatch Live Ops application for managing
delivery operations and support tickets.

Requirements:
- React.js frontend with Vite.
- Node.js and Express.js backend.
- Socket.IO for real-time communication.
- REST API architecture.
- Clean and modular project structure.
- Responsive and modern dashboard UI.
- Real-time ticket updates across multiple agents.
```

### 2. Backend Development

```text
Create a Node.js and Express.js backend for RapidDispatch Live Ops.

Requirements:
- Configure Express server.
- Integrate Socket.IO.
- Create a health-check API endpoint.
- Configure environment variables.
- Enable CORS for the frontend.
- Handle client connections and disconnections.
- Implement proper error handling.
- Use a clean and maintainable code structure.
```

### 3. Real-Time Communication

```text
Implement real-time communication using Socket.IO.

Requirements:
- Connect multiple agents to the same application.
- Broadcast ticket updates instantly.
- Synchronize changes across connected clients.
- Handle connection and disconnection events.
- Keep the application state updated without refreshing the page.
```

### 4. Ticket Locking System

```text
Implement a real-time ticket locking mechanism.

Requirements:
- Allow an agent to lock a ticket before editing.
- Prevent other agents from editing a locked ticket.
- Display the name of the agent currently holding the lock.
- Show a clear locked status in the interface.
- Allow the agent to save changes and release the lock.
- Automatically release locks when an agent disconnects.
- Prevent conflicting updates from multiple agents.
```

### 5. Frontend Dashboard Development

```text
Act as a professional UI/UX designer and React developer.

Create a modern RapidDispatch Live Ops dashboard.

Requirements:
- Responsive dashboard layout.
- Clean navigation and organized sections.
- Ticket management interface.
- Agent activity and ticket status indicators.
- Real-time updates using Socket.IO.
- Clear visual feedback for locked tickets.
- Modern typography, spacing, and interactive elements.
- Support desktop and mobile screens.
```

### 6. API and Frontend Integration

```text
Integrate the React frontend with the Express backend.

Requirements:
- Configure API base URL using Vite environment variables.
- Configure Socket.IO connection.
- Fetch and update ticket information.
- Handle API errors gracefully.
- Display loading and connection states.
- Keep frontend and backend data synchronized.
```

### 7. Testing and Debugging

```text
Act as a senior QA engineer.

Test the RapidDispatch Live Ops application.

Test scenarios:
1. Start the backend and frontend.
2. Verify the backend health endpoint.
3. Connect multiple agents.
4. Verify real-time ticket updates.
5. Lock a ticket using Agent 1.
6. Verify Agent 2 cannot edit the locked ticket.
7. Save changes and release the ticket.
8. Disconnect an agent and verify automatic lock release.
9. Check API and Socket.IO errors.
10. Verify responsive UI behavior.

Identify bugs and provide practical fixes.
```

### 8. Git and GitHub Setup

```text
Prepare the RapidDispatch Live Ops project for GitHub.

Requirements:
- Initialize Git.
- Create a proper .gitignore.
- Exclude node_modules, .env, and dist folders.
- Include .env.example files.
- Create a professional README.md.
- Create Prompts.md documentation.
- Commit the project with a meaningful commit message.
- Push the main branch to GitHub.
```

### 9. Backend Deployment on Render

```text
Prepare the RapidDispatch backend for Render deployment.

Requirements:
- Configure the production start command.
- Read PORT from environment variables.
- Configure CLIENT_ORIGIN.
- Support production CORS settings.
- Ensure Socket.IO works in production.
- Provide the required environment variables.
- Verify the deployed backend health endpoint.
```

### 10. Frontend Deployment on Vercel

```text
Prepare the RapidDispatch frontend for Vercel deployment.

Requirements:
- Configure Vite production build.
- Configure VITE_API_URL.
- Configure VITE_SOCKET_URL.
- Connect the frontend to the deployed backend.
- Configure Vercel routing.
- Verify the production application.
- Resolve deployment and API connection errors.
```

### 11. Code Quality and Optimization

```text
Review the complete RapidDispatch Live Ops codebase.

Requirements:
- Improve code readability and maintainability.
- Remove unused code.
- Optimize React components.
- Improve API error handling.
- Prevent duplicate Socket.IO listeners.
- Check security and environment variable handling.
- Ensure responsive design.
- Preserve all existing working features.
```

### 12. Documentation

```text
Generate professional project documentation for RapidDispatch Live Ops.

Include:
- Project overview.
- Problem statement.
- Key features.
- Technology stack.
- Project folder structure.
- Installation instructions.
- Environment variable configuration.
- Local development instructions.
- Testing instructions.
- Deployment instructions.
- GitHub repository information.
- Future improvements.
```

---

## Project Information

**Project:** RapidDispatch – Live Ops

**Frontend:** React.js, Vite

**Backend:** Node.js, Express.js

**Real-Time Communication:** Socket.IO

**Version Control:** Git and GitHub

## Future Enhancements

- Agent performance analytics.
- Advanced ticket prioritization.
- Role-based authentication.
- Notifications and alerts.
- Delivery tracking integration.
- Advanced reporting dashboard.

