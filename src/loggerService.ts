export type logLevel = "IMPORTANT" | "ERROR" | "INFO" | "DEBUG" | "TRACE"
export type logSilent = "SILENT"

const logLevelValue = {
    SILENT: 50,
    ERROR: 10,
    IMPORTANT: 9,
    INFO: 8,
    DEBUG: 6,
    TRACE: 4
}


export interface loggerOptions {
    logLevel: logLevel | logSilent,
    logFunction?: Function,
    logLevelFunctions?: {
        ERROR?: Function,
        IMPORTANT?: Function,
        INFO?: Function,
        DEBUG?: Function,
        TRACE?: Function
    },
    structuredOutput?: boolean,
    time?: boolean
}

export interface setLoggerParameters {
    customLogRule: logLevel | logSilent;
    customName: string;
    customMessage: string;
    customMessageLevel: logLevel | logSilent
}



export class LoggerService {
    logLevel: logLevel | logSilent;
    logLevelFunctions: {
        ERROR: Function,
        IMPORTANT: Function,
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
            IMPORTANT: logFunction,
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

    #toString(something: any): string {
        try {
            return JSON.stringify(something)
        }
        catch
        {
            return "Unserializable object"
        }
    }


    important(message: string, addTimestamp = this.time){
        this.#log("IMPORTANT", message, {addTimestamp})
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


    setLogger<T extends (...args: any[]) => any>(
        func: T,
        {
            customLogRule = this.logLevel,
            customName = func.name,
            customMessage = "",
            customMessageLevel = this.logLevel,
        }: Partial<setLoggerParameters> = {}

    ): (...args: Parameters<T>) => ReturnType<T> {
        const it = this;

        return function(...args: Parameters<T>): ReturnType<T> {
            it.#log("INFO", `Entering ${customName}`, { customLogRule });
            const startTime = performance.now();
            it.#log("DEBUG", `Arguments are ${it.#toString(args)}`, { customLogRule });

            try {
                const result = func(...args);
                if (result instanceof Promise || (result !== null && typeof result === 'object' && typeof result.then === 'function')) {
                    return result
                        .then((resolvedResult: any) => {
                            it.#handleSuccess(customName, startTime, resolvedResult, customLogRule);
                            it.#handleSpecialMessage(customMessage, customLogRule, customMessageLevel);
                            return resolvedResult;
                        })
                        .catch((err: unknown) => {
                            it.#handleError(customName, err, customLogRule);
                            throw err;
                        }) as ReturnType<T>;
                }
                it.#handleSuccess(customName, startTime, result, customLogRule);
                it.#handleSpecialMessage(customMessage, customLogRule, customMessageLevel);
                return result;

            } catch (err) {
                it.#handleError(customName, err, customLogRule);
                throw err;
            }
        };
    }

    #handleSuccess(name: string, startTime: number, result: any, customLogRule: logLevel | logSilent) {
        this.#log("INFO", `Finished ${name} in ${performance.now() - startTime} ms`, { customLogRule });
        this.#log("DEBUG", `Execution result of ${name} is ${this.#toString(result)}`, { customLogRule });
    }

    #handleError(name: string, err: unknown, customLogRule: logLevel | logSilent) {
        if (err instanceof Error) {
            this.#log("ERROR", `${name} threw ${err.stack}`, { customLogRule });
        } else {
            this.#log("ERROR", `${name} threw an unknown error`, { customLogRule });
        }
    }

    #handleSpecialMessage(message: string, customLogRule: logLevel | logSilent, messageLevel: logLevel | logSilent){
        if (message !== "") this.#log(messageLevel, message, {customLogRule});
    }


}

export default LoggerService