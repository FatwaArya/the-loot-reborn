const express = require('express');
const User = require('../model/user');
const Item = require('../model/item');
const router = express.Router();
const auth = require('../middleware/auth');
const sharp = require('sharp')
const stripe = require('stripe')(process.env.STRIPE);
const uploadUser = require('../middleware/upload');

//new user
router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
})

//login user
router.post('/users/login', async (req, res) => {
    //IMPORTANT
    const field = Object.keys(req.body)
    const allowedField = ['username', 'email', 'password']
    const isValidOperation = field.every(field => allowedField.includes(field))
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid login field'})
    }
    if (field.length > 2) {
        return res.status(400).send({error: 'Invalid login field'})
    }

    try {
        const user = await User.findByCredentials(req.body.username || req.body.email, req.body.password);

        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (error) {
        res.status(400).send(error.message);
    }
})

//make bid endpoint
router.post('/items/:id/bid', auth, async (req, res) => {
    if (req.user === undefined) {
        return res.status(400).send({error: 'You are not a user'})
    }
    try {
        //item by id and available status
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(400).send({error: 'Item not found'})
        }
        if (item.status !== 'available') {
            return res.status(400).send({error: 'Item is not available'})
        }
        if (item.merchant === req.user._id) {
            return res.status(400).send({error: 'You cannot bid on your own item'})
        }
        if (item.price >= req.body.bidAmount) {
            return res.status(400).send({error: 'Bid amount must be greater than the current bid amount'})
        }

        await item.auction(req.user._id, req.body.bidAmount);
        res.send(item);
    } catch (error) {
        console.log(error)
        res.status(400).send(error.message);
    }

})
//owned items endpoint
router.get('/items/owned', auth, async (req, res) => {
    if (req.user === undefined) {
        return res.status(400).send({error: 'You are not a user'})
    }
    try {
        const items = await Item.find({owner: req.user._id});
        res.send(items);
    } catch (error) {
        res.status(400).send(error.message);
    }
})


router.post('/users/me/avatar', auth, uploadUser.single('avatar'), async (req, res) => {
    if (req.user === undefined) {
        return res.status(400).send({error: 'You are not a user'})
    }
    const buffer = await sharp(req.file.buffer).resize({width: 144, height: 144}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res) => {
    res.status(400).send({error: error.message});
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    if (req.user === undefined) {
        return res.status(400).send({error: 'You are not a user'})
    }
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
}, (error, req, res) => {
    res.status(400).send({error: error.message});
})

router.get('/users/me/avatar', auth, async (req, res) => {
    if (req.user === undefined) {
        return res.status(400).send({error: 'You are not a user'})
    }

        try {
            if (!req.user.avatar) {
                throw new Error()
            }
            res.set('Content-Type', 'image/png');
            res.send(req.user.avatar);
        } catch (error) {
            res.status(404).send();

        }
    }
)


module.exports = router;