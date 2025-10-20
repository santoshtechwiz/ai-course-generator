// Example ordering quiz topics that can be used with the generateOrderingQuiz service

export const orderingQuizTopics = [
  {
    id: 1,
    title: "HTTP Request/Response Cycle",
    topic: "Web Development",
    steps: [
      "Client opens a connection to the server using TCP/IP",
      "Client sends HTTP request with method, URL, headers, and optional body",
      "Server processes the request and prepares a response",
      "Server sends HTTP response with status code, headers, and response body",
      "Client receives and processes the response (renders HTML, executes JavaScript)",
      "Connection closes or remains open for keep-alive",
    ],
  },
  {
    id: 2,
    title: "Git Workflow",
    topic: "Version Control",
    steps: [
      "Create a new branch from main/master",
      "Make changes and stage files using git add",
      "Commit changes with descriptive message",
      "Push commits to remote repository",
      "Create a pull request for code review",
      "Address review feedback and update commits",
      "Merge pull request into main branch",
    ],
  },
  {
    id: 3,
    title: "Docker Container Deployment",
    topic: "DevOps",
    steps: [
      "Write a Dockerfile with base image and dependencies",
      "Build Docker image from Dockerfile",
      "Tag the image with version number",
      "Push image to container registry (Docker Hub, ECR)",
      "Create container from image with environment variables",
      "Map ports and volumes for the container",
      "Run container and verify it's healthy",
      "Monitor logs and update image as needed",
    ],
  },
  {
    id: 4,
    title: "API Authentication with JWT",
    topic: "Security",
    steps: [
      "User submits credentials (username/password) to login endpoint",
      "Server validates credentials against database",
      "Server generates JWT token with user claims and signs with secret key",
      "Server sends JWT token to client in response",
      "Client stores JWT in local storage or secure cookie",
      "Client includes JWT in Authorization header for subsequent requests",
      "Server verifies JWT signature and validates token expiration",
      "If valid, server processes the authenticated request",
    ],
  },
  {
    id: 5,
    title: "Database Query Optimization",
    topic: "Database",
    steps: [
      "Analyze slow query using EXPLAIN plan",
      "Identify missing indexes on frequently queried columns",
      "Create indexes on single columns for simple queries",
      "Create composite indexes for multi-column WHERE clauses",
      "Review query joins and eliminate unnecessary table joins",
      "Add query result caching for repeated queries",
      "Monitor query performance with database profiler",
      "Optimize schema design if needed (denormalization)",
    ],
  },
  {
    id: 6,
    title: "CI/CD Pipeline Stages",
    topic: "DevOps",
    steps: [
      "Developer pushes code to repository",
      "Webhook triggers CI pipeline",
      "Code is checked out on build server",
      "Dependencies are installed (npm install, pip install)",
      "Unit tests are run and must pass",
      "Code linting/formatting checks performed",
      "Build artifact is created",
      "Integration tests run against artifact",
      "Artifact is pushed to staging environment",
      "Smoke tests run in staging",
      "Artifact is approved and pushed to production",
    ],
  },
  {
    id: 7,
    title: "SQL Query Execution",
    topic: "Database",
    steps: [
      "SQL query is parsed by parser for syntax correctness",
      "Query optimizer determines best execution plan",
      "Query plan is compiled into executable bytecode",
      "Query executor opens database connections",
      "Tables and indexes are accessed according to plan",
      "Rows are filtered using WHERE clause conditions",
      "Remaining rows are sorted according to ORDER BY",
      "Aggregation functions are applied if present",
      "HAVING clause filters aggregated results",
      "Final result set is returned to client",
    ],
  },
  {
    id: 8,
    title: "React Component Lifecycle (Class)",
    topic: "Frontend",
    steps: [
      "Constructor is called with props",
      "getDerivedStateFromProps is called before render",
      "Component's render method is called",
      "Children components render",
      "componentDidMount is called after DOM mounted",
      "State updates trigger re-render",
      "shouldComponentUpdate checks if update needed",
      "getSnapshotBeforeUpdate captures DOM state",
      "componentDidUpdate called after update",
      "Component unmounts from DOM",
      "componentWillUnmount cleanup methods called",
    ],
  },
  {
    id: 9,
    title: "Machine Learning Model Training",
    topic: "Machine Learning",
    steps: [
      "Collect and preprocess training data",
      "Split data into training and validation sets",
      "Define model architecture and hyperparameters",
      "Initialize model weights randomly",
      "Forward pass: input data through model",
      "Calculate loss using ground truth labels",
      "Backward pass: compute gradients via backpropagation",
      "Update model weights using optimizer (SGD, Adam)",
      "Evaluate model on validation set",
      "Repeat steps 4-9 for multiple epochs",
      "Test final model on held-out test set",
    ],
  },
  {
    id: 10,
    title: "Network Packet Transmission",
    topic: "Networking",
    steps: [
      "Application creates data to send",
      "Data is passed to Transport layer (TCP/UDP)",
      "Data is segmented into smaller packets",
      "Port number and destination port added",
      "Packets passed to Network layer (IP)",
      "Source IP and destination IP added",
      "Packets passed to Link layer (Ethernet)",
      "MAC addresses added to packets",
      "Packets converted to bits and sent to physical medium",
      "Router receives packets and forwards based on IP",
      "Destination receives packets and reassembles data",
      "Receiving application retrieves original data",
    ],
  },
]

// Difficulty ratings for topics
export const topicDifficulty: Record<string, "easy" | "medium" | "hard"> = {
  "HTTP Request/Response Cycle": "easy",
  "Git Workflow": "easy",
  "Docker Container Deployment": "medium",
  "API Authentication with JWT": "medium",
  "Database Query Optimization": "hard",
  "CI/CD Pipeline Stages": "medium",
  "SQL Query Execution": "hard",
  "React Component Lifecycle (Class)": "medium",
  "Machine Learning Model Training": "hard",
  "Network Packet Transmission": "hard",
}

// Helper to get a random topic
export function getRandomTopic() {
  const randomIndex = Math.floor(Math.random() * orderingQuizTopics.length)
  return orderingQuizTopics[randomIndex]
}

// Helper to get topic by ID
export function getTopicById(id: number) {
  return orderingQuizTopics.find((t) => t.id === id)
}

// Helper to get all unique topics
export function getAllTopics() {
  return orderingQuizTopics.map((t) => ({
    id: t.id,
    title: t.title,
    topic: t.topic,
    difficulty: topicDifficulty[t.title] || "medium",
  }))
}
