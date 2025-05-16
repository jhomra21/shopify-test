import { Hono } from 'hono'
import { cors } from 'hono/cors'


// Define a type for the binding that Hono will expect for environment variables
// This helps with TypeScript checking for c.env
// type Bindings = {
//   GEMINI_API_KEY: string;
//   // Add other environment bindings if you have them
// }

const app = new Hono() // Apply Bindings type to Hono (<{ Bindings: Bindings }>)

// Apply CORS middleware
app.use('*', cors({
  origin: '*', // Allow all origins
  allowHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'], // Specify allowed methods
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

app.get('/', (c) => c.text('Hello Hono on Cloudflare Workers for Gemini Proxy!'))



export default app