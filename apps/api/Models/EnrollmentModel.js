const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
    trek: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trek",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RegistrationForm",
        default: null
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        default: function() { return new mongoose.Types.ObjectId(); },
        index: true
    },
    primaryContact: {
        fullName: { type: String },
        email: { type: String },
        mobile: { type: String }
    },
    enrollmentData: {
        fullName: {
            type: String,
            required: true
        },
        age: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            enum: ["Male", "Female"],
            required: true
        },
        bloodGroup: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        mobile: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        pickupPoint: {
            type: String,
            required: true
        },
        foodPreference: {
            type: String,
            enum: ["Veg", "Non-veg"],
            required: true
        },
        medicalCondition: {
            type: String,
            enum: ["Yes", "No"],
            required: true
        },
        medicalConditionDetails: {
            type: String,
            required: false
        },
        emergencyName: {
            type: String,
            required: true
        },
        emerContactNumber: {
            type: String,
            required: true
        },
        emergencyRelation: {
            type: String,
            required: true
        }
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending"
    },
    paymentAmount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ["Online", "Cash", "Bank Transfer", "UPI", "NEFT", "IMPS"]
    },
    transactionId: {
        type: String
    },
    enrollmentStatus: {
        type: String,
        enum: ["Confirmed", "Pending", "Cancelled", "Completed"],
        default: "Pending"
    },
    specialRequests: {
        type: String
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
enrollmentSchema.index({ enrollmentStatus: 1 });
enrollmentSchema.index({ paymentStatus: 1 });
enrollmentSchema.index({ enrolledAt: -1 });
enrollmentSchema.index({ user: 1, trek: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
