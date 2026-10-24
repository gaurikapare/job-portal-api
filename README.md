# Job Portal API

A RESTful backend for a job portal built with **Node.js, Express.js, MongoDB, and Mongoose**. The API supports candidate and employer accounts, job listings, applications, JWT authentication, and role-based access control.

## Features

- Candidate and employer registration and login
- Password hashing with bcrypt and JWT authentication
- Role-based authorization and resource-ownership checks
- Create, list, search, filter, update, close, and delete jobs
- Pagination and sorting for job listings
- Apply for jobs and view application history
- Employer application management and status transitions
- Job application statistics
- Request validation and centralized error handling

## Tech Stack

- Node.js and Express.js
- MongoDB Atlas and Mongoose
- JSON Web Tokens (JWT)
- bcrypt
- express-validator
- Postman for API testing and documentation

## Project Structure

```text
job-portal-api/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── postman/
│   └── Job Portal API.postman_collection.json
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Data Model / Collection Relationships

The application uses three MongoDB collections:

- **Users**: Stores candidate and employer accounts. Passwords are stored as hashes. A user's role determines which operations they can perform.
- **Jobs**: Stores job listings created by employers. Each job references the employer who created it.
- **Applications**: Connects a candidate to a job. Each application references the candidate (`user`) and the job, and stores its cover letter and current status.

Relationship overview:

```text
Users (employer) 1 ──────── * Jobs
       │                       │
       │                       │ 1
       │                       │
Users (candidate) 1 ──────── * Applications
                               * ──────── 1 Jobs
```

A candidate can submit applications to multiple jobs. A job can receive applications from multiple candidates. An employer can create multiple jobs. Application references connect users and jobs.

## Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB Atlas account or a local MongoDB instance
- Postman

## Setup

### 1. Get the project

Download and extract the project ZIP, or clone your GitHub repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd job-portal-api
```

Open the project directory in VS Code.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a reference:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d
```

Replace the MongoDB placeholder with your connection string, including the database name (for example, `job_portal`). Generate a strong JWT secret locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output into `JWT_SECRET`.

**Security:** Never commit `.env` or publish database credentials, passwords, or JWT secrets. Ensure `.env` is listed in `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

Expected terminal output when the database connection succeeds:

```text
Connected to MongoDB
Job Portal API listening on port 5000
```

Local base URL: `http://localhost:5000`

## API Endpoints

Protected routes require the following header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a candidate or employer |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/auth/me` | Authenticated | Get the current user's profile |

Candidate registration requires `name`, `email`, `password`, and `role: "candidate"`. Employer registration also includes `companyName` and `role: "employer"`.

### Jobs — `/api/jobs`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/jobs` | Employer | Create a job |
| GET | `/api/jobs` | Public | List jobs with pagination |
| GET | `/api/jobs` with query parameters | Public | Search and filter jobs |
| GET | `/api/jobs/:jobId` | Public | Get one job |
| PUT | `/api/jobs/:jobId` | Job-owning employer | Update a job |
| PATCH | `/api/jobs/:jobId/close` | Job-owning employer | Close a job |
| GET | `/api/jobs/:jobId/stats` | Job-owning employer | Get application statistics |
| GET | `/api/jobs/:jobId/applications` | Job-owning employer | List applications for a job |
| POST | `/api/jobs/:jobId/apply` | Candidate | Apply to a job |
| DELETE | `/api/jobs/:jobId` | Job-owning employer | Delete a job |

Example queries:

```text
GET /api/jobs?page=1&limit=10
GET /api/jobs?search=Python&location=Pune&minSalary=30000&sort=-createdAt&page=1&limit=10
```

Use only query parameters supported by the implementation.

### Applications — `/api/applications`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/applications/my` | Candidate | View the current candidate's applications |
| PATCH | `/api/applications/:applicationId/status` | Employer | Update an application's status |
| DELETE | `/api/applications/:applicationId` | Application-owning candidate | Withdraw an application |

## Application Status Transitions

The intended status flow is:

```text
applied ──────> shortlisted ──────> hired
   │                  │
   └──────> rejected <┘
```

Allowed transitions:

- `applied` → `shortlisted`
- `applied` → `rejected`
- `shortlisted` → `hired`
- `shortlisted` → `rejected`

Other transitions should be rejected by the API. A candidate may withdraw their own application only when its status is `applied`, according to the project rules.

## Example Requests

### Register a candidate

`POST /api/auth/register`

```json
{
  "name": "Candidate One",
  "email": "candidate1@example.com",
  "password": "UseAUniqueTestPassword123!",
  "role": "candidate"
}
```

### Register an employer

`POST /api/auth/register`

```json
{
  "name": "Employer One",
  "email": "employer1@example.com",
  "password": "UseAUniqueTestPassword123!",
  "role": "employer",
  "companyName": "TechNova"
}
```

### Create a job

`POST /api/jobs` — requires an employer JWT.

```json
{
  "title": "Backend Developer",
  "description": "Build and maintain REST APIs.",
  "companyName": "TechNova",
  "location": "Pune",
  "type": "full-time",
  "salary": 40000,
  "skills": ["Node.js", "Express.js", "MongoDB"]
}
```

### Apply to a job

`POST /api/jobs/<JOB_ID>/apply` — requires a candidate JWT.

```json
{
  "coverLetter": "I am interested in this role and have relevant project experience."
}
```

## Postman Testing and Documentation

Import the exported collection from:

```text
postman/Job Portal API.postman_collection.json
```

The collection groups requests into **Auth**, **Jobs**, and **Applications**.

Recommended testing order:

1. Register a candidate and an employer.
2. Log in as both users and verify the JWT tokens.
3. Get the candidate profile.
4. Create a job as the employer.
5. List, search, retrieve, and update the job.
6. Apply to the job as the candidate.
7. View the candidate's applications.
8. View the employer's applications and job statistics.
9. Update application status.
10. Test closing/deleting a job and withdrawing an application last because these actions modify or remove data.

Use real `jobId` and `applicationId` values from successful responses. If a Postman collection variable is empty, inspect the preceding response and set the variable before sending a dependent request.

**Published Postman documentation:**  
https://documenter.getpostman.com/view/50940814/2sBYHUTfV1

Open the published link in a private/incognito window to verify that it is accessible before submission.

## Troubleshooting

### MongoDB `bad auth : authentication failed`

Verify the MongoDB database username and password in `.env`. The database user's password is different from the Atlas account password. URL-encode special characters in the connection-string password.

### `401 Unauthorized`

Check that the request includes a valid, unexpired JWT in the `Authorization` header.

### `404 Route not found: PATCH /api/applications//status`

The application ID is missing from the URL. First apply to a valid job, obtain the application ID from the response, and set the `applicationId` Postman collection variable.

### Port already in use

Stop the process using port `5000`, or change `PORT` in `.env` and update the Postman base URL.


