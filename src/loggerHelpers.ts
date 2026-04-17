import type {loggerOptions, logLevel, LoggerService} from './loggerService.js';
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    white: "\x1b[37m"
};

export const consoleConfig: loggerOptions = {
    logLevel: "DEBUG",
    structuredOutput: false,
    time: true,
    logLevelFunctions: {
        ERROR: (msg: string) => console.error(`${colors.red}${msg}${colors.reset}`),
        INFO: (msg: string) => console.log(`${colors.blue}${msg}${colors.reset}`),
        DEBUG: (msg: string) => console.log(`${colors.white}${msg}${colors.reset}`),
        TRACE: (msg: string) => console.log(msg)
    }
};

