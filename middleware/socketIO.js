const { Server } = require('socket.io');
const socketIOMiddleware = (httpServer) => {
    const allowedOrigins = process.env.ORIGIN_SERVER.split(",").map(
        (origin) => new RegExp(origin)
    );
    const io = new Server({
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.some((regex) => regex.test(origin))) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "*"],
        },
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
            skipMiddlewares: true,
        },
    });
    io.attach(httpServer);

    io.of('/').use((socket, next) => next());

    const ups = io.of('/dashboard');
    ups.use(async (socket, next) => {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        next();
    });

    ups.on('connection', async (socket) => {
        if (socket.recovered) {
            console.log(`recovery was successful: ${socket.id}, ${socket.rooms} and ${socket.data} were restored`)
            // recovery was successful: socket.id, socket.rooms and socket.data were restored
        } else {
            const token = socket.handshake.auth.token;
            const referer = socket.request.headers.referer;
            console.log(`A user connected use namespace /dashboard/token=${token}`);
            if (token) {

            }
            socket.on('send_payload', (data) => {
                console.log('Received payload:', data);

                // kirim kembali ke client tertentu atau broadcast
                socket.emit('payload_received', { message: 'Payload received!', data });

                // contoh broadcast ke semua client
                // io.emit('new_payload', data);
            });
            // Tangani peristiwa disconnect dari pengguna
            socket.on('disconnect', async () => {
                console.log("User disconnected from namespace /dashboard");
                const referer = socket.request.headers.referer;
                const userId = socket.handshake.auth.token;
                const mediaDoc = socket.handshake.auth.mediaDoc;
                console.log(referer);
                if (userId) {

                }
            });
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected");
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });
    });

    return (req, res, next) => {
        req.ups = ups;
        req.io = io;
        next();
    };
};

module.exports = socketIOMiddleware;