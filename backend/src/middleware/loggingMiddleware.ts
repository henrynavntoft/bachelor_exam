
import morgan from 'morgan';

//////////////////////////////////////////////////////////////////////////////////
// Middleware to log HTTP requests and responses
const format =
    process.env.RTE === 'prod' ? 'combined' :
        process.env.RTE === 'dev' ? 'dev' :
            'tiny';

export const loggingMiddleware = morgan(format);