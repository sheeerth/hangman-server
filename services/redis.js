const redis = require("redis");
const client = redis.createClient({
    host: 'redis'
});

client.on("error", function(error) {
    console.error(error);
});

const setValue = (key, value) => {
    client.set(key, value, redis.print);
}

const setJSONValue = (key, value) => {
    client.hmset(key, value, redis.print);
}

const getValue = (key) => {
    return new Promise((resolve, reject) => {
        client.get(key, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply);
            }
        });
    });
}

module.exports.setRedisValue = setValue;
module.exports.setRedisJSONValue = setJSONValue;
module.exports.getRedisValue = getValue;
