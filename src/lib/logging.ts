import chalk from 'chalk';
import { config } from 'dotenv';
import { inspect } from 'util';

import { ENV } from '../server';

config();

export type LogMessage = string | unknown | undefined;

export const log = {
    /** The Halper Logging System */
    debug: (message: LogMessage): void => {
        if (!ENV.DEBUG) return; // return if logging
        const color = chalk.cyan.bold`[DEBUG]\t| `;
        consoleLog(color, message);
    },
    ok: (message: LogMessage): void => {
        const color = chalk.greenBright.bold`[OK]\t| `;
        consoleLog(color, message);
    },
    warning: (message: LogMessage): void => {
        const color = chalk.yellow.bold`[WARN]\t| `;
        consoleLog(color, message);
    },
    error: (message: LogMessage): void => {
        const color = chalk.red.bold`[ERROR]\t| `;
        consoleLog(color, message);
    },
};

const consoleLog = (color: string, message: LogMessage) => {
    if (!message) return;
    color = color + chalk.reset('');
    let strMsg: string;
    if (typeof message !== 'string') {
        strMsg = inspect(message, false, 3);
    } else {
        strMsg = message;
    }

    // eslint-disable-next-line no-console
    console.log(
        strMsg
            .split('\n')
            .map(
                (v, i, a) =>
                    (a.length == 1
                        ? color
                        : i == 0
                            ? color.replace('|', '┌')
                            : i == a.length - 1
                                ? color.replace('|', '└')
                                : color.replace('|', '├')) + v
            )
            .join('\n')
    );
};
