const builder = {
    unauthorized: (prefix) => builder.prepare(403, prefix, "Authentication Error, please try again later!"),
    required: (prefix) => builder.prefix(401, prefix, "is a required feild!"),
    success: (prefix) => builder.prepare(200, prefix, "Successfully!"),
    error: (prefix) => builder.prepare(501, prefix, "error!")
}

builder.defineProperty(builder, {
    writable: false,
    value: (code, prefix, message) => ({
        code,
        message: `${prefix ? `${prefix + message}` : message}`
    })
})

module.exports = builder;