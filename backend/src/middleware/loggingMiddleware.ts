
import morgan from 'morgan';

// Determine log format based on runtime environment
const format =
    process.env.RTE === 'prod' ? 'combined' :
        process.env.RTE === 'dev' ? 'dev' :
            'tiny';

export const loggingMiddleware = morgan(format);