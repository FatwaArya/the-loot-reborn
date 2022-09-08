const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const Item = require('./item')

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'merchant'],
        default: 'user'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: value => {
            if (!validator.isEmail(value)) {
                throw new Error({ error: 'Invalid Email address' })
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate: value => {
            if (value.toLowerCase().includes('password')) {
                throw new Error({ error: 'Invalid Password' })
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, { timestamps: true });

//populate merchnat items
userSchema.virtual('items', {
    ref: 'Item',
    localField: '_id',
    foreignField: 'merchant',
    match: { role: 'merchant' }
}
)

// userSchema.virtual('items', {
//     ref: 'Item',
//     localField: '_id',
//     foreignField: 'merchant'
// }

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user.id.toString() }, process.env.SECRET,
        { expiresIn: '1h' })

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token

}

//find user by credentials using username or email
userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({ $or: [{ username }, { email: username }] })

    if (!user) {
        throw new Error('Invalid Credentials')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('Invalid Credentials')
    }
    return user
}


// userSchema.statics.findByCredentials = async (email, password) => {
//     const user = await User.findOne({ email } || { username: email })
//     if (!user) {
//         throw new Error('Unable to login')
//     }

//     const isMatch = await bcrypt.compare(password, user.password)
//     if (!isMatch) {
//         throw new Error('Unable to login')
//     }
//     return user
// }

//  hash password before saving
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})
//delete merchant item when user
userSchema.pre('deleteone', { document: true }, async function (next) {
    const user = this
    if (user.role === 'merchant') {
        await Item.deleteMany({ merchant: user._id })
    }
})

const User = mongoose.model('User', userSchema);
module.exports = User;
