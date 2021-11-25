import { promises } from 'fs';

import { BASE_URL } from '../server';
import { log } from './logging';

const fs = promises;

type cachedImage = {
    url: string;
    name: string;
    createdAt: number;
};

type imageCacheType = {
    cache: {
        [key: string]: cachedImage;
    };
    init: () => Promise<boolean>;
    createCacheForFile: (name: string) => Promise<boolean>;
    updateCacheForFile: (oldName: string, name: string) => Promise<boolean>;
    deleteCacheForFile: (name: string) => boolean;
};

export const ImageCache: imageCacheType = {
    cache: {},
    // read images folder with await, read birth time of each file and store in cache
    init: async () => {
        const files = await fs.readdir('images');
        for (const file of files) {
            await ImageCache.createCacheForFile(file);
        }
        log.debug('Image cache initialized');
        return true;
    },
    createCacheForFile: async (name: string) => {
        const stats = await fs.stat('images/' + name);
        ImageCache.cache[name] = {
            url: BASE_URL + name,
            name,
            createdAt: stats.birthtime.getTime(),
        };
        return true;
    },
    deleteCacheForFile: (name: string) => {
        delete ImageCache.cache[name];
        log.debug('Deleted image from cache');
        return true;
    },
    updateCacheForFile: async (oldName: string, name: string) => {
        ImageCache.deleteCacheForFile(oldName);
        await ImageCache.createCacheForFile(name);
        return true;
    },
};
