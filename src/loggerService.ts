export type logLevel = "ERROR" | "INFO" | "DEBUG" | "TRACE"
export type logSilent = "SILENT"

const logLevelValue = {
    SILENT: 50,
    ERROR: 10,
    INFO: 8,
    DEBUG: 6,
    TRACE: 4
}


export interface loggerOptions {
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


export class LoggerService {
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
        return (addTimestamp ? `[${(new Date()).toISOString()}]` : "") + ` [${level}] ` + message
    }

    #levelAccept(level: logLevel | logSilent, customLogRule: logLevel | logSilent =  this.logLevel){
        //console.log(`level is ${level}, custom level is ${customLogRule}, global level is ${this.logLevel}`)
        return (logLevelValue[level] >= logLevelValue[customLogRule]) && (logLevelValue[level] >= logLevelValue[this.logLevel])
    }

    #log(level: logLevel | logSilent, message: string, {addTimestamp = this.time, customLogRule = this.logLevel} = {addTimestamp: this.time, customLogRule: this.logLevel}){
        if (this.#levelAccept(level, customLogRule) && level !== "SILENT"){
            if (!this.structuredOutput) this.logLevelFunctions[level](this.#addMeta(message, level, addTimestamp))
            else this.logLevelFunctions[level](JSON.stringify({level, message, timestamp: addTimestamp ? (new Date()).toISOString() : undefined}))
        }
    }


    error(message: string, addTimestamp = this.time){
        this.#log("ERROR", message, {addTimestamp})
    }

    info(message: string, addTimestamp = this.time){
        this.#log("INFO", message, {addTimestamp})
    }

    debug(message: string, addTimestamp = this.time){
        this.#log("DEBUG", message, {addTimestamp})
    }

    trace(message: string, addTimestamp = this.time){
        this.#log("TRACE", message, {addTimestamp})
    }

    setLogger<T extends (...args: any[]) => any>(func: T, customLogRule: logLevel | logSilent = this.logLevel): (...args: Parameters<T>) => ReturnType<T> {
        const it = this;
        return function (...args: any[]): ReturnType<T>{
            it.#log("INFO", `Entering ${func.name}`, {customLogRule});
            const startTime = performance.now()
            it.#log("DEBUG", `Arguments are ${args}`, {customLogRule});
            try {
                const result: any = func(...args);
                it.#log("INFO", `Finished ${func.name} in ${performance.now() - startTime} ms`, {customLogRule});
                it.#log("DEBUG", `Execution result of ${func.name} is ${result}`, {customLogRule})
                return result;
            } catch (err){
                if (err instanceof Error) {
                    it.#log("ERROR", `${func.name} threw ${err.stack}`, {customLogRule});
                    throw err;
                } else throw "Error is not an error"
            }
        }
    }

    setAsyncLogger<T extends (...args: any[]) => any>(func: T, customLogRule: logLevel | logSilent = this.logLevel): (...args: Parameters<T>) => Promise<ReturnType<T>> {
        const it = this;
        return async function (...args: any[]): Promise<ReturnType<T>>{
            it.#log("INFO", `Entering ${func.name}`, {customLogRule});
            const startTime = performance.now()
            it.#log("DEBUG", `Arguments are ${args}`, {customLogRule});
            try {
                const result: any = await func(...args);
                it.#log("INFO", `Finished ${func.name} in ${performance.now() - startTime} ms`, {customLogRule});
                it.#log("DEBUG", `Execution result of ${func.name} is ${result}`, {customLogRule})
                return result;
            } catch (err){
                if (err instanceof Error) {
                    it.#log("ERROR", `${func.name} threw ${err.stack}`, {customLogRule});
                    throw err;
                } else throw "Error is not an error"
            }
        }
    }

}

export default LoggerService