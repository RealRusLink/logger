type logLevel = "ERROR" | "INFO" | "DEBUG" | "TRACE"
type logSilent = "SILENT"

const logLevelValue = {
    SILENT: 50,
    ERROR: 10,
    INFO: 8,
    DEBUG: 6,
    TRACE: 4
}


interface loggerOptions {
    logLevel: logLevel | logSilent,
    logFunction?: Function,
    logLevelFunctions?: {
        ERROR?: Function,
        INFO?: Function,
        DEBUG?: Function,
        TRACE?: Function
    },
    structuredOutput?: boolean,
    time?: boolean
}


class LoggerService {
    logLevel: logLevel | logSilent;
    logLevelFunctions: {
        ERROR: Function,
        INFO: Function,
        DEBUG: Function,
        TRACE: Function
    };
    structuredOutput: boolean;
    time: boolean;
    constructor(loggerOptions: loggerOptions) {
        this.logLevel = loggerOptions.logLevel;
        const logFunction = loggerOptions.logFunction || console.log
        this.logLevelFunctions = {
            ERROR: logFunction,
            INFO: logFunction,
            DEBUG: logFunction,
            TRACE: logFunction
        }
        let key: logLevel
        for (key in loggerOptions.logLevelFunctions){
            this.logLevelFunctions[key] = loggerOptions.logLevelFunctions?.[key] || logFunction;
        }
        this.structuredOutput = loggerOptions.structuredOutput !== undefined ? loggerOptions.structuredOutput : false;
        this.time = loggerOptions.time !== undefined ? loggerOptions.time : true;
    }

    #addMeta(message: string, level: string, addTimestamp = this.time){
        return addTimestamp ? `[${(new Date()).toISOString()}]` : "" + ` [${level}] ` + message
    }

    #levelAccept(level: logLevel | logSilent){
        return logLevelValue[this.logLevel] <= logLevelValue[level]
    }

    #log(level: logLevel | logSilent, message: string, addTimestamp = this.time){
        if (this.#levelAccept(level) && level !== "SILENT"){
            if (!this.structuredOutput) this.logLevelFunctions[level](this.#addMeta(message, level, addTimestamp))
            else this.logLevelFunctions[level](JSON.stringify({level, message, timestamp: addTimestamp ? (new Date()).toISOString() : undefined}))
        }
    }


    error(message: string, addTimestamp = this.time){
        this.#log("ERROR", message, addTimestamp)
    }

    info(message: string, addTimestamp = this.time){
        this.#log("INFO", message, addTimestamp)
    }

    debug(message: string, addTimestamp = this.time){
        this.#log("DEBUG", message, addTimestamp)
    }

    trace(message: string, addTimestamp = this.time){
        this.#log("TRACE", message, addTimestamp)
    }

    setLogger<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T> {
        const it = this;
        return function (...args: any[]): ReturnType<T>{
            it.#log("INFO", `Entering ${func.name}`);
            const startTime = performance.now()
            it.#log("DEBUG", `Arguments are ${args}`);
            try {
                const result: any = func(...args);
                it.#log("INFO", `Finished ${func.name} in ${performance.now() - startTime} ms`);
                it.#log("DEBUG", `Execution result of ${func.name} is ${result}`)
                return result;
            } catch (err){
                if (err instanceof Error) {
                    it.#log("ERROR", `${func.name} threw ${err.stack}`);
                    throw err;
                } else throw "Error is not an error"
            }
        }
    }

}

