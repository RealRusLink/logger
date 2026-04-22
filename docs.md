# LoggerService Documentation

A powerful, flexible logging utility for TypeScript/JavaScript with support for function instrumentation, multiple log levels, structured output, and custom log handlers.

---

## Quick Setup

### 1. Installation

```bash
npm install @yourorg/logger-service
# or
yarn add @yourorg/logger-service
```

### 2. Build from Source (if needed)

If you're installing from source or after updating:

```bash
# Navigate to logger directory
cd logger

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Output will be in dist/ directory
```

**Build is required because:**
- TypeScript needs to be compiled to JavaScript
- `dist/` directory is used by consumers via exports
- Without build, imports will fail

### 3. First Use

```typescript
import { LoggerService, consoleConfig } from "./logger/dist/index.js";

// Create logger with default config
const logger = new LoggerService(consoleConfig);

// Start logging
logger.info("Application started");
logger.debug("Debug information");
logger.error("An error occurred");
```

---

## Log Levels

Logger supports 6 log levels in order of priority:

| Level | Priority | Use Case |
|-------|----------|----------|
| **SILENT** | 50 | Disable all logging |
| **ERROR** | 10 | Errors and exceptions |
| **IMPORTANT** | 9 | Critical initialization, important milestones |
| **INFO** | 8 | General information, normal operation |
| **DEBUG** | 6 | Debugging information, function entry/exit |
| **TRACE** | 4 | Detailed trace, arguments, results, performance |

### Priority Rules

- Only messages at or **above** the set level are logged
- If `logLevel = "INFO"`, you see: SILENT, ERROR, IMPORTANT, INFO
- If `logLevel = "DEBUG"`, you see: SILENT, ERROR, IMPORTANT, INFO, DEBUG
- If `logLevel = "TRACE"`, you see everything

**Example:**
```typescript
const logger = new LoggerService({ logLevel: "INFO" });

logger.error("This shows");       // ✅ ERROR >= INFO
logger.important("This shows");   // ✅ IMPORTANT >= INFO
logger.info("This shows");        // ✅ INFO >= INFO
logger.debug("This DOESN'T");     // ❌ DEBUG < INFO
logger.trace("This DOESN'T");     // ❌ TRACE < INFO
```

---

## Configuration

### Basic Configuration

```typescript
import { LoggerService, consoleConfig } from "./logger/dist/index.js";

const logger = new LoggerService(consoleConfig);
```

### Custom Configuration

```typescript
import { LoggerService, type loggerOptions } from "./logger/dist/index.js";

const customConfig: loggerOptions = {
    logLevel: "DEBUG",              // Set minimum log level
    structuredOutput: false,        // Use JSON format (see below)
    time: true,                     // Include timestamps
    logFunction: console.log,       // Default function for all levels
    logLevelFunctions: {            // Override per level
        ERROR: console.error,
        IMPORTANT: console.log,
        INFO: console.log,
        DEBUG: console.log,
        TRACE: console.log
    }
};

const logger = new LoggerService(customConfig);
```

### Configuration Options

#### `logLevel: logLevel | "SILENT"`
Minimum log level to display. Only messages at this level or higher are shown.

```typescript
logLevel: "INFO"  // Show ERROR, IMPORTANT, INFO
logLevel: "TRACE" // Show everything
logLevel: "SILENT" // Show nothing
```

#### `structuredOutput: boolean` (default: false)
When `true`, logs are output as JSON. Useful for log aggregation systems.

**Plain output (default):**
```
[2024-01-15T10:30:45.123Z] [INFO] Application started
```

**Structured output:**
```json
{"level":"INFO","message":"Application started","timestamp":"2024-01-15T10:30:45.123Z"}
```

#### `time: boolean` (default: true)
Include or exclude ISO timestamp in logs.

```typescript
time: true  // [2024-01-15T10:30:45.123Z] [INFO] message
time: false // [INFO] message
```

#### `logFunction: Function` (default: console.log)
Default logging function used by all levels.

```typescript
logFunction: (msg) => process.stderr.write(msg + "\n")
logFunction: (msg) => fs.appendFileSync("app.log", msg + "\n")
```

#### `logLevelFunctions: { ERROR?, IMPORTANT?, INFO?, DEBUG?, TRACE? }`
Override the logging function for specific levels.

```typescript
logLevelFunctions: {
    ERROR: (msg) => console.error(msg),
    IMPORTANT: (msg) => console.log(colors.green + msg + colors.reset),
    INFO: (msg) => sendToLoggingService(msg),
    DEBUG: (msg) => console.log(msg),
    TRACE: (msg) => console.log(msg)
}
```

---

## Basic Usage

### Simple Logging

```typescript
const logger = new LoggerService(consoleConfig);

logger.error("Database connection failed");
logger.important("Server initialized");
logger.info("User logged in");
logger.debug("Processing request");
logger.trace("Detailed operation info");
```

### Dynamic Timestamp Control

Each log method accepts an optional `addTimestamp` parameter:

```typescript
logger.info("With timestamp", true);   // Default behavior
logger.info("Without timestamp", false);
logger.info("Uses global setting");    // Uses config.time value
```

---

## 🔧 Advanced Features

### 1. Function Instrumentation with `setLogger`

Automatically log function entry, exit, timing, and arguments:

```typescript
const logger = new LoggerService(consoleConfig);

// Define function
function calculateTotal(items: number[]): number {
    return items.reduce((a, b) => a + b, 0);
}

// Instrument it
const instrumentedFunc = logger.setLogger(calculateTotal, {
    customName: "calculateTotal",
    customMessage: "Calculation completed successfully",
    customMessageLevel: "IMPORTANT"
});

// Use it
const result = instrumentedFunc([1, 2, 3]);
// Logs:
// [DEBUG] Entering calculateTotal
// [TRACE] Arguments are [1,2,3]
// [DEBUG] Finished calculateTotal in 0.123 ms
// [TRACE] Execution result of calculateTotal is 6
// [IMPORTANT] Calculation completed successfully
```

### 2. Multiple Function Logging with `setMultipleLoggers`

Automatically instrument all public methods of a class:

```typescript
class UserService {
    getUser(id: string) {
        return { id, name: "John" };
    }

    createUser(name: string) {
        return { id: "123", name };
    }

    deleteUser(id: string) {
        return true;
    }
}

const service = new UserService();

// Instrument all methods at once
const loggedService = logger.setMultipleLoggers(service);

// All methods now logged
loggedService.getUser("123");
// [DEBUG] Entering UserService.getUser
// [TRACE] Arguments are ["123"]
// [DEBUG] Finished UserService.getUser in 0.456 ms
// [TRACE] Execution result of UserService.getUser is {"id":"123","name":"John"}
```

**Behavior:**
- Skips constructor and private methods (starting with `_`)
- Binds methods to original context
- Maintains `this` reference correctly
- Works with async functions

### 3. Constructor Wrapping with `wrapConstructor`

Log class instantiation:

```typescript
class DatabaseConnection {
    constructor(host: string, port: number) {
        this.connect(host, port);
    }

    private connect(host: string, port: number) {
        // Connection logic
    }
}

// Wrap constructor
const LoggedConnection = logger.wrapConstructor(DatabaseConnection, {
    customMessage: "Database connected successfully",
    customMessageLevel: "IMPORTANT"
});

// Use it
const db = new LoggedConnection("localhost", 5432);
// [DEBUG] Entering DatabaseConnection constructor
// [TRACE] Arguments are ["localhost", 5432]
// [DEBUG] Finished DatabaseConnection constructor in 123 ms
// [IMPORTANT] Database connected successfully
```

---

## Example

Complete example with initialization chain:

```typescript
import { LoggerService, consoleConfig } from "./logger/dist/index.js";

// 1. Create logger
const logger = new LoggerService(consoleConfig);
logger.logLevel = "DEBUG";

// 2. Create service class
class DatabaseService {
    constructor(private connectionString: string) {
        logger.info("DatabaseService initialized");
    }

    async query(sql: string) {
        logger.trace(`Executing: ${sql}`);
        // Simulate async operation
        return new Promise(resolve => {
            setTimeout(() => resolve({ rows: [] }), 100);
        });
    }

    async connect() {
        logger.debug("Attempting connection...");
        await new Promise(resolve => setTimeout(resolve, 50));
        logger.important("Connected to database");
    }
}

// 3. Instantiate and log
const db = new DatabaseService("postgres://localhost:5432/app");

// 4. Instrument methods
const loggedDb = logger.setMultipleLoggers(db);

// 5. Use it
await loggedDb.connect();
await loggedDb.query("SELECT * FROM users");
```

**Output:**
```
[2024-01-15T10:30:45.123Z] [INFO] DatabaseService initialized
[2024-01-15T10:30:45.200Z] [DEBUG] Entering DatabaseService.connect
[2024-01-15T10:30:45.205Z] [DEBUG] Attempting connection...
[2024-01-15T10:30:45.260Z] [DEBUG] Finished DatabaseService.connect in 55 ms
[2024-01-15T10:30:45.260Z] [IMPORTANT] Connected to database
[2024-01-15T10:30:45.300Z] [DEBUG] Entering DatabaseService.query
[2024-01-15T10:30:45.305Z] [TRACE] Arguments are ["SELECT * FROM users"]
[2024-01-15T10:30:45.310Z] [TRACE] Executing: SELECT * FROM users
[2024-01-15T10:30:45.420Z] [DEBUG] Finished DatabaseService.query in 120 ms
[2024-01-15T10:30:45.425Z] [TRACE] Execution result of DatabaseService.query is {"rows":[]}
```

---

## Color Configuration

The logger comes with a built-in color configuration for console output:

```typescript
import { consoleConfig } from "./logger/dist/index.js";

// consoleConfig provides:
// ERROR:     Red text
// IMPORTANT: Green text
// INFO:      Blue text
// DEBUG:     Normal text
// TRACE:     White text
```

### Custom Colors

```typescript
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bold: "\x1b[1m",
    dim: "\x1b[2m"
};

const customConfig: loggerOptions = {
    logLevel: "DEBUG",
    structuredOutput: false,
    time: true,
    logLevelFunctions: {
        ERROR: (msg) => console.error(`${colors.red}${colors.bold}${msg}${colors.reset}`),
        IMPORTANT: (msg) => console.log(`${colors.green}${colors.bold}${msg}${colors.reset}`),
        INFO: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
        DEBUG: (msg) => console.log(msg),
        TRACE: (msg) => console.log(`${colors.dim}${colors.white}${msg}${colors.reset}`)
    }
};

const logger = new LoggerService(customConfig);
```

---

## JSON/Structured Output

For production logging to log aggregation services (ELK, Datadog, etc.):

```typescript
const jsonConfig: loggerOptions = {
    logLevel: "INFO",
    structuredOutput: true,  // Enable JSON format
    time: true,
    logFunction: (msg) => console.log(msg)
};

const logger = new LoggerService(jsonConfig);

logger.info("Application started");
logger.error("Connection failed");

// Output:
// {"level":"INFO","message":"Application started","timestamp":"2024-01-15T10:30:45.123Z"}
// {"level":"ERROR","message":"Connection failed","timestamp":"2024-01-15T10:30:45.200Z"}
```

Then pipe to log aggregation:
```bash
node app.js | jq . | nc logstash.example.com 5000
```

---

## Special Behaviors

### 1. Function Result Logging

Results are logged automatically:

```typescript
const sum = logger.setLogger((a: number, b: number) => a + b, {
    customName: "sum"
});

sum(5, 3);
// [TRACE] Execution result of sum is 8
```

### 2. Async Function Support

Async functions are fully supported:

```typescript
const fetchData = logger.setLogger(async (url: string) => {
    const response = await fetch(url);
    return response.json();
}, {
    customName: "fetchData"
});

await fetchData("https://api.example.com/data");
// [DEBUG] Entering fetchData
// [TRACE] Arguments are ["https://api.example.com/data"]
// [DEBUG] Finished fetchData in 234 ms
// [TRACE] Execution result of fetchData is {...}
```

### 3. Error Logging with Stack Traces

Errors are caught and logged with full stack:

```typescript
const divide = logger.setLogger((a: number, b: number) => {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
}, {
    customName: "divide"
});

try {
    divide(10, 0);
} catch (e) {
    // Logger already logged the error
}

// [ERROR] divide threw Error: Division by zero
//     at divide (app.ts:123:15)
//     at ...
```

### 4. Unserializable Objects

Objects that can't be JSON serialized are handled gracefully:

```typescript
const circular: any = { a: 1 };
circular.self = circular;  // Circular reference

const log = logger.setLogger((obj: any) => obj, {
    customName: "process"
});

process(circular);
// [TRACE] Execution result of process is "Unserializable object"
```

### 5. Private Method Exclusion

Methods starting with `_` are not instrumented by `setMultipleLoggers`:

```typescript
class Service {
    public method() { }     // ✅ Instrumented
    _private() { }          // ❌ Skipped
    #actual() { }           // ❌ Skipped
    constructor() { }       // ❌ Skipped
}

logger.setMultipleLoggers(new Service());
```

---

## Integration Examples

### With Hono Web Framework

```typescript
import { Hono } from "hono";
import { LoggerService, consoleConfig } from "./logger/dist/index.js";

const logger = new LoggerService(consoleConfig);
const app = new Hono();

// Log middleware
app.use(async (c, next) => {
    logger.debug(`Incoming: ${c.req.method} ${c.req.path}`);
    const start = performance.now();
    await next();
    logger.info(`${c.req.method} ${c.req.path} - ${Math.round(performance.now() - start)}ms`);
});

// Log routes
const loggedApp = logger.setMultipleLoggers(app);
```

### With Database Connections

```typescript
import { Pool } from "pg";

class DatabaseAdapter {
    constructor(private pool: Pool) {}

    async query(sql: string) {
        return this.pool.query(sql);
    }
}

const adapter = new DatabaseAdapter(pool);
const loggedAdapter = logger.setMultipleLoggers(adapter);

// All queries now logged with timing
await loggedAdapter.query("SELECT * FROM users");
```

### With Service Initialization

```typescript
import { LoggerService, consoleConfig } from "./logger/dist/index.js";

const logger = new LoggerService(consoleConfig);
logger.logLevel = process.env.LOG_LEVEL || "INFO";

// Services
const config = logger.wrapConstructor(Config, {
    customMessage: "Configuration loaded",
    customMessageLevel: "IMPORTANT"
});

const db = logger.wrapConstructor(Database, {
    customMessage: "Database connected",
    customMessageLevel: "IMPORTANT"
});

const api = logger.wrapConstructor(ApiService, {
    customMessage: "API service ready",
    customMessageLevel: "IMPORTANT"
});

// Initialize in sequence
const appConfig = new config();
const appDb = new db(appConfig);
const appApi = new api(appDb, appConfig);
```

---

##  Important Behaviors

### 1. Custom Log Rules

Override the global log level for specific functions:

```typescript
logger.logLevel = "INFO";

const verbose = logger.setLogger(myFunction, {
    customLogRule: "TRACE"  // Always log at TRACE for this function
});

const quiet = logger.setLogger(anotherFunc, {
    customLogRule: "ERROR"  // Only log errors for this function
});
```

### 2. Async Function Result Timing

Timing is measured until the Promise resolves:

```typescript
const slowFunc = logger.setLogger(async () => {
    await new Promise(r => setTimeout(r, 1000));
    return "done";
}, {
    customName: "slowFunc"
});

await slowFunc();
// [DEBUG] Finished slowFunc in 1000.123 ms  ← Includes async wait time
```

### 3. Method Context Preservation

When using `setMultipleLoggers`, context is preserved:

```typescript
class Service {
    name = "MyService";
    
    method() {
        return this.name;  // 'this' still refers to instance
    }
}

const service = new Service();
const logged = logger.setMultipleLoggers(service);

console.log(logged.method());  // "MyService" ✅
```

### 4. Constructor Arguments Included in Trace

Constructor arguments are logged in TRACE level:

```typescript
const LoggedClass = logger.wrapConstructor(MyClass, {
    customName: "MyClass"
});

new LoggedClass(arg1, arg2, arg3);
// [TRACE] Arguments are [arg1, arg2, arg3]
```


## API Reference

### LoggerService Class

```typescript
new LoggerService(options: loggerOptions)
```

**Properties:**
- `logLevel: logLevel | "SILENT"` — Get/set current log level
- `logLevelFunctions: object` — Functions for each level
- `structuredOutput: boolean` — JSON output enabled
- `time: boolean` — Timestamp enabled

**Methods:**

| Method | Signature | Use |
|--------|-----------|-----|
| `important()` | `(message, addTimestamp?) => void` | Critical milestones |
| `error()` | `(message, addTimestamp?) => void` | Errors |
| `info()` | `(message, addTimestamp?) => void` | General info |
| `debug()` | `(message, addTimestamp?) => void` | Debug info |
| `trace()` | `(message, addTimestamp?) => void` | Detailed trace |
| `setLogger()` | `(func, options?) => func` | Instrument function |
| `setMultipleLoggers()` | `(instance) => instance` | Instrument class |
| `wrapConstructor()` | `(class, options?) => class` | Log instantiation |

---

##  Troubleshooting

### No logs appearinsg?

Check log level:
```typescript
logger.logLevel = "TRACE";  // Ensure not set to SILENT or too high
```

### Too many logs?

Reduce log level:
```typescript
logger.logLevel = "INFO";  // Show only INFO and above
```

### Timestamps not showing?

Check time option:
```typescript
const config: loggerOptions = {
    ...otherOptions,
    time: true  // Ensure enabled
};
```

### Objects not serializing?

Objects that can't be JSON.stringified will show "Unserializable object". This is by design to prevent crashes.

---

## TypeScript Types

```typescript
// Log level type
type logLevel = "IMPORTANT" | "ERROR" | "INFO" | "DEBUG" | "TRACE";

// Silent keyword
type logSilent = "SILENT";

// Configuration interface
interface loggerOptions {
    logLevel: logLevel | logSilent;
    logFunction?: Function;
    logLevelFunctions?: {
        ERROR?: Function;
        IMPORTANT?: Function;
        INFO?: Function;
        DEBUG?: Function;
        TRACE?: Function;
    };
    structuredOutput?: boolean;
    time?: boolean;
}

// Parameters for setLogger
interface setLoggerParameters {
    customLogRule: logLevel | logSilent;
    customName: string;
    customMessage: string;
    customMessageLevel: logLevel | logSilent;
}
```



**Key features:**
- 6 log levels with priority filtering
- Function instrumentation with timing
- Automatic method logging for classes
- Constructor wrapping
- Async/Promise support
- Error logging with stack traces
- Structured JSON output
- Custom log handlers per level
