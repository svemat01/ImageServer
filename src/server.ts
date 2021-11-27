import { config } from 'dotenv';
import express from 'express';
import fs from 'fs';

import { apiv1 } from './api';
import { ImageCache } from './lib/imageCache';
import { log } from './lib/logging';

// #region ENV
config();
const required_env_vars = ['PORT', 'UPLOAD_LIMIT', 'AUTH', 'BASE_URL'];

enum Environment {
    PORT,
    UPLOAD_LIMIT,
    AUTH,
    DEBUG,
    BASE_URL,
}

for (const env_var of required_env_vars) {
    if (!process.env[env_var]) {
        log.error(
            `Env variable: "${env_var}" doesn't exist in env variables, please add it and start again`
        );
        process.exit();
    }
}

export const ENV: Partial<{ [key in keyof typeof Environment]: string }> =
    Object.assign(
        {},
        ...Object.keys(process.env)
            .filter((a) => a in Environment)
            .map((a) => ({ [a]: process.env[a] }))
    );

export const authTokens = ENV.AUTH?.trim().split(',') ?? [];

// #endregion

export const BASE_URL: string = ENV.BASE_URL ?? `http://localhost:${ENV.PORT}/`;

if (!fs.existsSync('images/')) {
    fs.mkdirSync('images/');
}

const app = express();

app.use('/api/v1', apiv1);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use(express.static('images'));

app.use(function (req, res) {
    res.status(404).send('404:\nSorry can\'t find that!');
});

app.listen(ENV.PORT, () => {
    (async () => {
        await ImageCache.init();
        log.debug(ImageCache.cache);
    })();

    log.ok(`Server started at ${BASE_URL}`);
    log.ok(`Port: ${ENV.PORT}`);
    log.ok(`Upload limit: ${ENV.UPLOAD_LIMIT} MB`);
    log.ok(`Auth tokens: ${authTokens.join(', ')}`);
    log.ok(`Debug mode: ${ENV.DEBUG ?? 'false'}`);
    log.ok(`Environment: ${process.env.NODE_ENV}`);
});
