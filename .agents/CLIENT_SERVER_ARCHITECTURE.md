# Full-Stack Client & Server Architecture Standards (Micro-Frontend & Microservice Orientation)

This document defines the authoritative directory structure, module/feature boilerplate templates, and architectural principles for both Server (Backend) and Client (Frontend) codebases. The goal is to enforce **SOLID** principles, High Cohesion, Loose Coupling, and readiness for distributed architectures (**Microservices** on the Server and **Micro-Frontends** on the Client) from project inception.

---

## I. OVERALL ARCHITECTURAL MODEL

```
+-------------------------------------------------------------------------+
|                       CLIENT (FEATURE-SLICED / MODULAR)                 |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |     Feature 1      |  |     Feature 2      |  |     Feature 3     |  |
|  +---------+----------+  +---------+----------+  +---------+---------+  |
|            |                       |                       |            |
|            +-----------------------+-----------------------+            |
|                                    |                                    |
|                        [ HTTP / REST / WebSocket ]                      |
|                                    |                                    |
|            +-----------------------+-----------------------+            |
|            |                       |                       |            |
|  +---------+----------+  +---------+----------+  +---------+---------+  |
|  |      Module 1      |  |      Module 2      |  |      Module 3     |  |
|  +---------+----------+  +---------+----------+  +---------+---------+  |
|  | SERVER (MODULAR MONOLITH - PACKAGE-BY-FEATURE)                       |
|  |  +----------------------------------------------------------------+  |
|  |  | Core Layer (Security / Config / Exception / Base Classes)      |  |
|  |  +----------------------------------------------------------------+  |
+--+-------------------------------------------------------------------+--+
```

---

## II. SERVER ARCHITECTURE (MODULAR MONOLITH / MICROSERVICE-READY)

### 1. Standard Directory Structure (Package-by-Feature)

The Server codebase is organized as a **Modular Monolith**, strictly separating the shared system foundation (`core/`) from independent domain modules (`modules/`).

```text
src/main/java/com/company/project/
├── core/                               # Shared system core layer
│   ├── base/                           # Base classes (BaseEntity, BaseRepository, BaseService)
│   ├── config/                         # App configurations (Database, Cors, Security, Swagger...)
│   ├── exception/                      # Global Exception Handler & system error codes
│   └── security/                       # Security & Auth (JWT Filter, Principal, UserDetailsService)
│
└── modules/                            # Independent domain modules (Microservice-ready)
    ├── module-1/                       # Domain Module 1 (Isolated)
    ├── module-2/                       # Domain Module 2 (Isolated)
    └── module-3/                       # Domain Module 3 (Isolated)
```

---

### 2. Detailed Boilerplate Template for a Server Module (`module-1`)

Every new feature module on the Server MUST strictly adhere to the following internal directory structure and responsibility boundaries:

```text
modules/module-1/
├── controller/
│   └── Module1Controller.java          # REST API Endpoints: Handles HTTP requests/responses, calls Service
├── dto/
│   ├── Module1CreateRequest.java       # Request DTO for create operations (with @Valid, @NotNull...)
│   ├── Module1UpdateRequest.java       # Request DTO for update operations
│   └── Module1Response.java            # Response DTO returned to Client
├── entity/
│   └── Module1Entity.java              # JPA Entity: Database table mapping (extends BaseEntity)
├── mapper/
│   └── Module1Mapper.java              # Mapper: Converts between Entity <-> DTO (MapStruct or custom)
├── repository/
│   └── Module1Repository.java          # Spring Data JPA Repository Interface (module-scoped DB access)
└── service/
    ├── Module1Service.java             # PUBLIC Service Interface (contract exposed to other modules)
    └── impl/
        └── Module1ServiceImpl.java     # Service Implementation: Encapsulates core business logic
```

#### Layer Responsibilities:
- **`controller/`**: Parses HTTP requests, validates DTOs, delegates to `Module1Service`, and returns structured responses. Never contains business logic or direct database queries.
- **`dto/`**: Decouples API payloads from database entities. Acts as the strict validation boundary.
- **`entity/`**: Encapsulates database schema fields and ORM relationships for this module only.
- **`repository/`**: Performs database operations strictly for this module's tables.
- **`service/Module1Service.java`**: The **ONLY public API contract** that external modules are allowed to invoke.

---

### 3. Server Technical Standards

1. **Strict Module Boundary (Zero Direct Cross-Module DB Access):**
   - **Never** inject a Repository from another module (e.g., `Module1Service` MUST NOT inject `Module2Repository`).
   - Cross-module communication MUST occur exclusively via **Public Service Interfaces** (`Module2Service`) or event-driven messaging (**Event Bus / Message Queue**).
   - This ensures that any module can be extracted into an independent **Microservice** without breaking dependencies.
2. **DTO & Strict Input Validation:**
   - 100% of incoming HTTP requests MUST be validated via DTOs using standard validation annotations (`@Valid`, `@NotNull`, `@NotBlank`, `@Min`, etc.).
   - **Never** pass JPA Entities directly as Controller parameters or return them directly in HTTP responses.
3. **Centralized Exception Handling:**
   - Do NOT write repetitive `try/catch` blocks in business services to swallow errors.
   - Throw structured `CustomException(ErrorCode.xxx)` instances and let `core/exception/GlobalExceptionHandler` handle them to guarantee a consistent JSON error format.
4. **Clean Code & Imports:**
   - Do NOT use Fully Qualified Class Names (FQCN) within code bodies.
   - Maintain zero IDE warnings, remove unused imports, and avoid dead code.

---

## III. CLIENT ARCHITECTURE (FEATURE-SLICED / MICRO-FRONTEND-READY)

### 1. Standard Directory Structure (Feature-Sliced Architecture)

The Client codebase is partitioned into self-contained feature modules (`features/`), isolating UI presentation from side-effects and API communication, ready for **Micro-Frontend** federation.

```text
src/
├── app/                                # Core app setup (Router, Global Providers, App bootstrapper)
├── features/                           # Self-contained feature modules (Micro-Frontend ready)
│   ├── feature-1/                      # Feature Module 1 (Isolated)
│   ├── feature-2/                      # Feature Module 2 (Isolated)
│   └── feature-3/                      # Feature Module 3 (Isolated)
├── shared/                             # Reusable resources across the entire application
│   ├── components/                     # Design System / Common UI (Button, Modal, Toast, Table...)
│   ├── hooks/                          # Reusable utility hooks (useWindowSize, useDebounce...)
│   ├── layouts/                        # Application layouts (MainLayout, AuthLayout, AdminLayout...)
│   ├── utils/                          # Formatting, validation, and helper utilities
│   └── types/                          # Global TypeScript types and interfaces
├── infra/                              # Infrastructure (HTTP Client wrapper, Interceptors, WebSocket)
└── main.tsx                            # Application Entry Point
```

---

### 2. Detailed Boilerplate Template for a Client Feature (`feature-1`)

Every new feature module on the Client MUST follow this standardized internal structure:

```text
features/feature-1/
├── components/                         # Pure Presentational Components (receives Props, renders UI)
│   ├── Feature1Table.tsx               # Table/list component for Feature 1
│   ├── Feature1Modal.tsx               # Modal/popup component for Feature 1
│   └── Feature1Form.tsx                # Form component for Feature 1
├── hooks/                              # Custom Hooks: Encapsulates ALL business logic & side-effects
│   ├── useFeature1List.ts              # Hook for fetching lists, handling loading / error states
│   └── useFeature1Mutations.ts         # Hook for Create/Update/Delete operations + Toast notifications
├── services/                           # Services: Dedicated HTTP API calls & WebSocket endpoints
│   └── feature1Service.ts              # Functions calling /api/v1/feature-1/... endpoints
├── store/                              # Local State Management (Zustand / Redux / Context slice)
│   └── feature1Slice.ts                # Slice managing feature-specific state
├── types/                              # TypeScript Definitions for Feature 1
│   └── index.ts                        # Interfaces and type aliases for Feature 1 DTOs and state
└── index.ts                            # MODULE PUBLIC API: Single export point for external consumers
```

#### Layer Responsibilities:
- **`components/*.tsx`**: Pure UI Presenters. **Never** include `fetch`/`axios` calls or asynchronous side-effect logic directly inside UI components.
- **`hooks/*.ts`**: Bridges UI components and API services. Manages `isLoading`, `isError`, and triggers Toast notifications.
- **`services/*.ts`**: Contains all HTTP request endpoints and network client logic for this feature.
- **`index.ts` (at `features/feature-1/index.ts`)**: Acts as the **Public Contract** of the feature. Only exports components, hooks, or types that other features or app pages explicitly require.

---

### 3. Client Technical Standards

1. **Separation of Concerns (UI Presenter vs. Logic Side-Effects):**
   - UI components (`components/`) render UI and emit events.
   - All network calls, WebSocket handlers, and asynchronous logic MUST be encapsulated in **Custom Hooks** (`hooks/`) or **Services** (`services/`).
2. **Module Isolation & Micro-Frontend Readiness:**
   - Feature modules MUST be self-contained and avoid circular dependencies.
   - Exporting strictly through `index.ts` enables seamless extraction into federated **Micro-Frontends** (e.g., Module Federation).
3. **RBAC Routing & Layout Hierarchy:**
   - Define explicit routing hierarchies mapped to user roles (e.g., Public, Customer, Partner, Admin).
   - Guard each route and redirect unauthorized access gracefully to the appropriate authentication page.
4. **Production-Ready User Experience (UX):**
   - **Loading States:** All asynchronous operations MUST display `Skeleton` loaders or `Spinners`; never show blank screens.
   - **Error Boundaries:** Wrap feature modules in `ErrorBoundary` components to isolate runtime crashes.
   - **Toast Notifications:** Always display Toast feedback for async API actions (success or failure).

---

## IV. CLIENT - SERVER API COMMUNICATION STANDARDS

1. **Standardized Response Envelope:**
   All API endpoints MUST return JSON payloads formatted with a consistent envelope:
   ```json
   {
     "success": true,
     "code": 200,
     "message": "Operation completed successfully",
     "data": { ... },
     "timestamp": "2026-07-30T12:00:00Z"
   }
   ```
2. **Token Management & HTTP Interceptors:**
   - Client HTTP client wrappers MUST automatically attach `Authorization: Bearer <token>` headers via Interceptors.
   - On HTTP 401 Unauthorized errors, interceptors should attempt silent token refresh or redirect gracefully to `/login`.

---

## V. PRE-RELEASE / DEPLOYMENT CHECKLIST

- [ ] **1. Clean Imports & Zero Warnings:** Zero IDE warnings, no unused variables/imports, no FQCN.
- [ ] **2. Strict Module Boundary:** No cross-module Repository/Database direct calls.
- [ ] **3. Strict Validation:** 100% of API endpoints use DTOs with strict validation rules (`@Valid`).
- [ ] **4. Exception Handling & Toasts:** Exceptions are caught by Global Exception Handlers and displayed via Toast notifications on the Client.
- [ ] **5. Loading States:** Skeletons or Spinners are implemented for all async operations.
- [ ] **6. Feature Public API (`index.ts`):** Client features export only via `index.ts` with no deep cross-imports.
- [ ] **7. Props & Callback Safety:** React component props are strictly typed with fallback default values.
