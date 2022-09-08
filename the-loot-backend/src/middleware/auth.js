const jwt = require('jsonwebtoken');
const User = require('../model/user');

//auth user and merchant

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        if (user.role === 'merchant') {
            req.merchant = user;
            next();
        }
        if (user.role === 'user') {
            req.user = user;
            next();
        }
        if (!user) {
            throw new Error('Not authenticated');
        }

    } catch (error) {
        res.status(401).send({ error: 'Invalid Token' });
    }
}
module.exports = auth;

//         const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
//         if (!user) {
//             throw new Error();
//         }
//         req.user = user;
//         req.token = token;
//         next();
//     } catch (error) {
//         res.status(401).send({ error: 'Please authenticate.' });
//     }
// }