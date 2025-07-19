const crypto = require('crypto');

class HashService {
    static hashSHA256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
module.exports = HashService;