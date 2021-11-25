import express from 'express';
import fs from 'fs';
import multer from 'multer';

import { ImageCache } from './lib/imageCache';
import { log } from './lib/logging';
import { makeId } from './lib/makeId';
import { authTokens, BASE_URL } from './server';

export const apiv1 = express.Router();

// express upload image to images folder
// image types png, jpg, jpeg, gif and svg (max size: 5mb) with url return
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'images');
        },
        filename: (req, file, cb) => {
            const fileExt = file.originalname.split('.')[1];
            cb(null, makeId(6) + '.' + fileExt);
        },
    }),
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/gif' ||
            file.mimetype === 'image/svg'
        ) {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(
                new Error(
                    'Only .png, .jpg, .jpeg, .gif and .svg format allowed!'
                )
            );
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

// express js use check auth token
apiv1.use(function (req, res, next) {
    // check header or url parameters or post parameters for token
    const token = req.headers['authorization']?.split(' ')[1];
    // decode token
    if (token) {
        if (authTokens.includes(token)) {
            next();
        } else {
            res.status(401).send('Unauthorized');
        }
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.',
        });
    }
});

apiv1.post('/upload', upload.single('image'), async (req, res) => {
    if (req.file) {
        await ImageCache.createCacheForFile(req.file.filename);
    }

    res.json({
        originalName: req.file?.originalname,
        name: req.file?.filename,
        url: BASE_URL + req.file?.filename,
    });
});

// function to rename file from input in folder images
apiv1.post('/rename', express.json(), (req, res) => {
    const { oldName, newName } = req.body;

    const re = /^\w/;
    if (!re.test(newName) || !re.test(oldName)) {
        return res.status(500).json({
            error: re.test(oldName)
                ? 'newName is not a valid file'
                : 'oldName is not a valid file',
        });
    }

    const oldPath = 'images/' + oldName;
    const newPath = 'images/' + newName;
    // rename file in development environment
    fs.rename(oldPath, newPath, async (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        log.debug('Rename complete!');
        await ImageCache.updateCacheForFile(oldName, newName);

        res.json({
            message: 'Rename complete!',
        });
    });
});

// express return all images in images folder
apiv1.get('/list', (req, res) => {
    res.json(ImageCache.cache);
});

// express delete image file from images folder
apiv1.post('/delete', express.json(), (req, res) => {
    log.debug(req.body);
    const { name } = req.body;

    const re = /^\w/;
    if (!re.test(name)) {
        return res.status(500).json({ error: 'name is not a valid file' });
    }

    const path = 'images/' + name;
    log.debug(path);
    fs.unlink(path, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        log.debug('Delete complete!');

        ImageCache.deleteCacheForFile(name);

        res.json({
            message: 'Delete complete!',
        });
    });
});
