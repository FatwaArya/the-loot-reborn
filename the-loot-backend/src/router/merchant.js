const express = require('express');
const User = require('../model/user');
const Item = require('../model/item');
const router = express.Router();
const auth = require('../middleware/auth');
const sharp = require('sharp')
const uploadMerchant = require('../middleware/upload');
const uploadItem = require('../middleware/upload');
//new merchant
router.post('/merchants', async (req, res) => {
    const merchant = new User(req.body);
    merchant.role = 'merchant';
    try {
        await merchant.save();
        const token = await merchant.generateAuthToken();
        res.status(201).send({ merchant, token });
    } catch (error) {
        res.status(400).send(error);
    }
})

//login merchant
router.post('/merchants/login', async (req, res) => {

    //IMPORTANT
    const field = Object.keys(req.body)
    const allowedField = ['username', 'email', 'password']
    const isValidOperation = field.every(field => allowedField.includes(field))
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid login field' })
    }
    if (field.length > 2) {
        return res.status(400).send({ error: 'Invalid login field' })
    }
    try {
        const merchant = await User.findByCredentials(req.body.username || req.body.email, req.body.password);
        if (merchant.role !== 'merchant') {
            return res.status(400).send({ error: 'You are not a merchant' })
        }
        const token = await merchant.generateAuthToken();
        res.send({ merchant, token });
    } catch (error) {
        res.status(400).send(error.message);
    }
})

//merchant can close auction
router.post('/merchants/items/:id/close', auth, async (req, res) => {

    try {
        //item by id and available status
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(400).send({ error: 'Item not found' })
        }
        if (item.status !== 'available') {
            return res.status(400).send({ error: 'Item is not available' })
        }
        if (item.merchant === req.user) {
            return res.status(400).send({ error: 'You are not the merchant' })
        }
        await item.closeAuction();
        res.send(item,"Item closed");
    } catch (error) {
        res.status(400).send(error.message);
    }
})

//new items
router.post('merchants/items', auth, async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    const item = new Item({
        ...req.body,
        merchant: req.merchant._id,
        bids: {
            bidAmount: req.body.price
        },
    })
    try {
        await item.save();
        res.status(201).send(item);
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }

})

//get all items of a merchant
router.get('merchants/items', auth, async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    try {
        const items = await Item.find({ merchant: req.merchant }).populate('merchant', { _id: 1 });
        res.send(items);
    } catch (error) {
        console.log(error)
        res.status(400).send(error.message);
    }
})

//fetch all items
router.get('/items/all', async (req, res) => {
    try {
        const items = await Item.find({ status: 'available' })
        res.send(items);

    } catch (error) {
        res.status(400).send(error.message);
    }
})

//update item
router.patch('/merchants/items/:id', auth, async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    const updates = Object.keys(req.body);
    const allowedUpdates = ['itemName', 'description', 'price', 'image'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates' })
    }
    try {
        const item = await Item.findOne({ _id: req.params.id, merchant: req.merchant._id });
        if (!item) {
            return res.status(400).send({ error: 'Item not found' })
        }
        updates.forEach(update => item[update] = req.body[update]);
        await item.save();
        res.send(item);
    } catch (error) {
        res.status(400).send(error.message);
    }
})

//upload avatar

router.post('/merchants/avatar', auth, uploadMerchant.single('avatar'), async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.merchant.avatar = buffer;
    await req.merchant.save();
    res.send();
}, (error, req, res) => {
    res.status(400).send({ error: error.message });
})

//delete avatar
router.delete('/merchants/avatar', auth, async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    req.merchant.avatar = undefined;
    await req.merchant.save();
    res.send();
})

//get avatar
router.get('/merchants/avatar', auth, async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    try {
        if (!req.merchant.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/png');
        res.send(req.merchant.avatar);
    } catch (error) {
        res.status(400).send();
    }
})

router.post('/merchants/items/:id/image', auth, uploadItem.single('image'), async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    const item = await Item.findById(req.params.id);
    if (!item) {
        return res.status(400).send({ error: 'Item not found' })
    }
    item.image = buffer;
    await item.save();
    res.send();
} , (error, req, res) => {
    res.status(400).send({ error: error.message });
})

//delete item image
router.delete('/merchants/items/:id/image', auth, async (req, res) => {
    if (req.merchant === undefined) {
        return res.status(400).send({ error: 'You are not a merchant' })
    }
    const item = await Item.findById(req.params.id);
    if (!item) {
        return res.status(400).send({ error: 'Item not found' })
    }
    item.image = undefined;
    await item.save();
    res.send();
}, (error, req, res) => {
    res.status(400).send({ error: error.message });
})

//get item image


module.exports = router;