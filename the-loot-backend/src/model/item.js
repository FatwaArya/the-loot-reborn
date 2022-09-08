//make items model
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['available', 'sold'],
        default: 'available'
    },
    bidders:[{
        bidder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'

        },
        bidAmount: {
            type: Number,
            required: true,
            trim: true,
            default: 0
        }
    }],

    image: {
        type: Buffer
    },
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }

}, { timestamps: true });

itemSchema.methods.auction = async function (id , bidAmount) {
    const item = this;
    item.price = bidAmount;
    if (item.bidders === undefined) {
        item.bidders = [];
    }
  //push bidder to bidders array, if bidder is already in array, update bidAmount
    const bidder = item.bidders.find(bidder => bidder.bidder.toString() === id.toString());
    if (bidder) {
        bidder.bidAmount = bidAmount;
    }
    else {
        item.bidders.push({
            bidder: id,
            bidAmount: bidAmount
        });
    }
    await item.save();
}
itemSchema.methods.closeAuction = async function () {
    const item = this;
    //if there is no bidders, sent error
    if (item.bidders.length === 0) {
        throw new Error('No bidders');
    }
    item.status = 'sold';
    const itemObj = item.toObject();
    const highestBidder = itemObj.bidders[itemObj.bidders.length - 1];
    item.owner = highestBidder.bidder;
    await item.save();
}




const Item = mongoose.model('Item', itemSchema);

module.exports = Item;

