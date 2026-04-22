# LoggerService 

## Quick Start

### 1. Build the Logger

```bash
cd logger
npm install
npm run build
```

### 2. Use in Your App

```typescript
import { LoggerService, consoleConfig } from "./logger/dist/index.js";

const logger = new LoggerService(consoleConfig);
logger.logLevel = "INFO";

logger.important("Application started");
logger.info("Processing data");
logger.error("Something failed");
```

### 3. Instrument Functions

```typescript
// Log function automatically
const myFunc = logger.setLogger((a, b) => a + b, {
    customName: "add",
    customMessage: "Calculation done"
});

myFunc(5, 3);
// Logs: entry, arguments, exit time, result, success message
```

### 4. Instrument Classes

```typescript
class UserService {
    getUser(id: string) { /* ... */ }
    createUser(name: string) { /* ... */ }
}

const service = new UserService();
const logged = logger.setMultipleLoggers(service);

// All methods now logged automatically
logged.getUser("123");
```

---

## Features

###  What LoggerService Does

-  **6 Log Levels:** SILENT, ERROR, IMPORTANT, INFO, DEBUG, TRACE
-  **Auto-Instrumentation:** Functions and class methods logged automatically
-  **Performance Tracking:** Measures execution time automatically
-  **Preconfigured:** Console output with ANSI colors
-  **Structured Output:** JSON format for log aggregation systems(not ready)
-  **Type Safe:** Full TypeScript support with proper types
-  **Async Ready:** Full support for Promises and async/await

###  Demonstration:

```typescript
// Simple logging
logger.info("Server started");
logger.error("Connection failed");

// Function instrumentation
const logged = logger.setLogger(myFunction, {
    customName: "processData",
    customMessage: "Processing complete"
});

// Class instrumentation
const loggedService = logger.setMultipleLoggers(service);

// Constructor logging
const LoggedClass = logger.wrapConstructor(MyClass, {
    customMessage: "Initialized"
});

// Custom output
const customLogger = new LoggerService({
    logLevel: "INFO",
    structuredOutput: true,
    time: true,
    logLevelFunctions: {
        ERROR: (msg) => sendToSentry(msg)
    }
});

// Async functions
const apiCall = logger.setLogger(async (url) => {
    return fetch(url).then(r => r.json());
}, { customName: "apiCall" });

await apiCall("https://api.example.com");
```

---



### Log Levels (Priority-Based)

```
SILENT        (50) — Disable all
ERROR         (10) — Errors only
IMPORTANT     (9)  — Errors + Important
INFO          (8)  — Errors + Important + Info (default)
DEBUG         (6)  — + Debug messages(function calls, execution time)
TRACE         (4)  — + Detailed trace(arguments and results logging, be careful)
```

Only messages at or **above** the set level are shown.

### Output Format

**Plain Text (default):**
```
[2024-01-15T10:30:45.123Z] [INFO] Application started
[2024-01-15T10:30:45.200Z] [ERROR] Connection failed
```

**JSON (structured output):**
```json
{"level":"INFO","message":"Application started","timestamp":"2024-01-15T10:30:45.123Z"}
{"level":"ERROR","message":"Connection failed","timestamp":"2024-01-15T10:30:45.200Z"}
```

### Function Instrumentation Output

When you instrument a function, it logs:

```
[DEBUG] Entering functionName
[TRACE] Arguments are [arg1, arg2, ...]
[DEBUG] Finished functionName in X.XXX ms
[TRACE] Execution result of functionName is {...}
```

For errors:
```
[ERROR] functionName threw Error: description
    at functionName (file.ts:line:col)
    at ...
```

##  Use Cases

### Use Case 1: Development Logging

```typescript
const logger = new LoggerService({
    ...consoleConfig,
    logLevel: "TRACE"  // See all details
});
```

### Use Case 2: Production Monitoring

```typescript
const logger = new LoggerService({
    logLevel: "INFO",
    structuredOutput: true,  // JSON for log aggregation
});
```

### Use Case 3: Performance Testing

```typescript
const logger = new LoggerService({
    logLevel: "DEBUG",
    logLevelFunctions: {
        TRACE: (msg) => recordPerformanceMetric(msg)
    }
});
```

### Use Case 4: Error Tracking

```typescript
const logger = new LoggerService({
    logLevel: "ERROR",
    logLevelFunctions: {
        ERROR: (msg) => sendToErrorTracking(msg)
    }
});
```

---

##  Configuration  Reference

```typescript
const logger = new LoggerService({
    // Minimum log level to show
    logLevel: "INFO",
    
    // Use JSON output instead of plain text
    structuredOutput: false,
    
    // Include ISO timestamp in logs
    time: true,
    
    // Default function for all levels
    logFunction: console.log,
    
    // Override per level
    logLevelFunctions: {
        ERROR: console.error,
        IMPORTANT: console.log,
        INFO: console.log,
        DEBUG: console.log,
        TRACE: console.log
    }
});
```

---

## Example: Complete Application Setup

```typescript
import { LoggerService, consoleConfig } from "./logger/dist/index.js";

// 1. Create logger
const logger = new LoggerService({
    ...consoleConfig,
    logLevel: process.env.LOG_LEVEL || "INFO"
});

logger.important("Starting application");

// 2. Instrument database service
class Database {
    async connect() { /* ... */ }
    async query(sql: string) { /* ... */ }
}

const db = new Database();
const loggedDb = logger.setMultipleLoggers(db);

// 3. Instrument API service
class API {
    async getUser(id: string) { /* ... */ }
    async createUser(data: any) { /* ... */ }
}

const api = new API();
const loggedApi = logger.setMultipleLoggers(api);

// 4. Use with logging
await loggedDb.connect();          // Logged: entry, exit, timing
const user = await loggedApi.getUser("123");  // Logged: entry, args, exit, result

logger.important("Application ready");
```

**Output:**
```
[IMPORTANT] Starting application
[DEBUG] Entering Database.connect
[DEBUG] Finished Database.connect in 45 ms
[IMPORTANT] Application ready
[DEBUG] Entering API.getUser
[TRACE] Arguments are ["123"]
[DEBUG] Finished API.getUser in 12 ms
[TRACE] Execution result of API.getUser is {...}
```

---

## Common Workflows

### Workflow 1: Set Up Logger in New Project

1. Run `npm install git:RealRusLink/logger`
2. Buid: `cd ./node_modules/logger, then npm run build, then cd ../..`
3. Import: `import {LoggerService, consoleConfig} from "logger/dist/index.js"`
4. Create instance: `const logger = new LoggerService(consoleConfig)`
5. Set level: `logger.logLevel = "INFO"`
6. Start logging: `logger.important("Ready")`



### Workflow 2: Add Logging to Existing Class

1. Create logger
2. Call: `const logged = logger.setMultipleLoggers(serviceInstance)`
3. Use logged instance instead of original
4. All public methods now logged automatically


### Workflow 3: Instrument Critical Function

1. Create logger
2. Wrap function: `logger.setLogger(myFunc, { customName: "myFunc" })`
3. Use wrapped version
4. Entry, exit, timing, arguments logged automatically


### Workflow 4: Configure for Production

1. Update logger config:
   ```typescript
   logLevel: process.env.LOG_LEVEL || "INFO",
   structuredOutput: true,
   logFunction: (msg) => console.log(msg)
   ```
2. Send logs to aggregation service
3. Set environment variable: `LOG_LEVEL=INFO`


## Package Contents

```
logger/
├── src/
│   ├── index.ts              # Main exports
│   ├── loggerService.ts      # Logger implementation (200 lines)
│   └── loggerHelpers.ts      # consoleConfig helper
├── dist/                     # Generated after build
│   ├── index.js
│   ├── index.d.ts
│   ├── loggerService.js
│   ├── loggerService.d.ts
│   ├── loggerHelpers.js
│   └── loggerHelpers.d.ts
├── package.json
├── tsconfig.json
└── README.md (this file)
```

**Size:**
- Source: ~8KB (3 files)
- Compiled: ~25KB (JS + types)
- Zero dependencies


