require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRouter = require("./routes/authRoutes")
const trekRouter = require("./routes/trekRoutes")
const enrollmentRouter = require("./routes/enrollmentRoutes")
const categoryRouter = require("./routes/categoryRoutes")
const reviewRouter = require("./routes/reviewRoutes")
const galleryRouter = require("./routes/galleryRoutes")
const passwordResetRoutes = require("./routes/passwordResetRoutes")
const siteRouter = require("./routes/siteRoutes")
const contactRouter = require("./routes/contactRoutes")
const cors = require("cors")
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'dev' ? 1000 : 100, // higher limit in dev
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV !== 'dev') {
  app.use(limiter);
}

// Stricter CORS configuration
const corsOptions = {
    origin: (() => {
      if (process.env.NODE_ENV === 'production') {
        return [
          'https://avirtrekkers.com',
          'https://www.avirtrekkers.com'
        ];
      } else if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'stage') {
        return [
          'https://staging.avirtrekkers.com',
          'https://avirtrekkers.com',
          'https://www.avirtrekkers.com'
        ];
      } else {
        return [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://192.168.0.102:3000'
        ];
      }
    })(),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(requestLogger);
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp());           // Prevent HTTP parameter pollution

const connectDB = require("./db/connect")
const PORT = process.env.PORT || 4000;

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/treks", trekRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/site", siteRouter);
app.use("/api/contact", contactRouter);
app.use("/api/auth", passwordResetRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({
      status: "ok",
      service: "avir-trekkers-api",
      version: "1.0.0",
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(503).json({ status: "error", message: "Health check failed" });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

const start = async()=>{
    try{
        await connectDB(process.env.MONGODB_URL);
        app.listen(PORT,'0.0.0.0', ()=>{
          console.log(`Server is running at port  ${PORT}`)
          console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
        })
        
    }
    catch(error){
        console.error("Database connection error:", error)
        process.exit(1)
    }
}
start();

