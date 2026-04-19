import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {LoggerService} from "../dist/index.js";
describe('LoggerService', () => {
    let logSpy: any;
    let errorSpy: any;

    beforeEach(() => {
        logSpy = vi.spyOn(console, 'log').mockImplementation((...args) => {
            console.dir('Mock Log: ' + args[0] + '\n');
        });
        errorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
            console.dir('Mock Error: ' + args[0] + '\n');
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Log Level Filtering', () => {
        it('should not log when level is SILENT', () => {
            const logger = new LoggerService({ logLevel: 'SILENT' });
            logger.error('test error');
            expect(logSpy).not.toHaveBeenCalled();
            expect(errorSpy).not.toHaveBeenCalled();
        });

        it('should log ERROR when level is ERROR', () => {
            const logger = new LoggerService({ logLevel: 'ERROR' });
            logger.error('error message');
            logger.info('info message');
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy.mock.calls[0][0]).toContain('[ERROR] error message');
        });

        it('should log everything when level is TRACE', () => {
            const logger = new LoggerService({ logLevel: 'TRACE' });
            logger.error('err');
            logger.info('inf');
            logger.debug('dbg');
            logger.trace('trc');
            expect(logSpy).toHaveBeenCalledTimes(4);
        });

        it("shouldn't log anything below global level", () => {
            const logger = new LoggerService({ logLevel: 'ERROR' });
            const name = (name: string) => name;
            const loggedName = logger.setLogger(name, "INFO");
            loggedName("hi");
            expect(logSpy).toHaveBeenCalledTimes(0);
            logger.logLevel = "INFO";
            loggedName("hi");
            expect(logSpy).toHaveBeenCalledTimes(2);
        })

    });

    describe('Output Formatting', () => {
        it('should output structured JSON when structuredOutput is true', () => {
            const logger = new LoggerService({
                logLevel: 'INFO',
                structuredOutput: true,
                time: false
            });
            logger.info('json test');
            const output = JSON.parse(logSpy.mock.calls[0][0]);
            expect(output).toEqual({
                level: 'INFO',
                message: 'json test'
            });
        });

        it('should omit timestamp when time is false', () => {
            const logger = new LoggerService({
                logLevel: 'INFO',
                time: false
            });
            logger.info('no time');
            expect(logSpy.mock.calls[0][0]).not.toMatch(/\d{4}-\d{2}-\d{2}/);
            expect(logSpy.mock.calls[0][0]).toBe(' [INFO] no time');
        });
    });

    describe('Custom Log Functions', () => {
        it('should use custom logLevelFunctions', () => {
            const customSpy = vi.fn();
            const logger = new LoggerService({
                logLevel: 'ERROR',
                logLevelFunctions: { ERROR: customSpy }
            });
            logger.error('custom');
            expect(customSpy).toHaveBeenCalled();
            expect(logSpy).not.toHaveBeenCalled();
        });
    });

    describe('Decorators / Wrappers', () => {
        it('setLogger should log entry, execution and exit', () => {
            const logger = new LoggerService({ logLevel: 'DEBUG', time: false });
            const testFn = (a: number, b: number) => a + b;
            const wrapped = logger.setLogger(testFn);

            const result = wrapped(2, 3);

            expect(result).toBe(5);
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Entering testFn'));
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Arguments are 2,3'));
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Finished testFn'));
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Execution result of testFn is 5'));
        });

        it('setLogger should log and rethrow errors', () => {
            const logger = new LoggerService({ logLevel: 'ERROR' });
            const errorFn = () => { throw new Error('fail'); };
            const wrapped = logger.setLogger(errorFn);

            expect(() => wrapped()).toThrow('fail');
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] errorFn threw'));
        });

        it('setAsyncLogger should handle promises correctly', async () => {
            const logger = new LoggerService({ logLevel: 'INFO', time: false });
            const asyncFn = async (val: string) => val;
            const wrapped = await logger.setAsyncLogger(asyncFn);

            const result = await wrapped('hello');

            expect(result).toBe('hello');
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Entering asyncFn'));
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Finished asyncFn'));
        });
    });
});