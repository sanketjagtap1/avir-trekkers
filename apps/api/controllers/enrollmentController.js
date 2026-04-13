const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Enrollment = require("../Models/EnrollmentModel");
const Trek = require("../Models/TrekModel");
const OTP = require("../Models/OTPModel");
const {
    sendOtpEmail,
    sendEnrollmentConfirmation,
    sendPaymentConfirmation,
    sendCancellationConfirmation,
} = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const VERIFICATION_TOKEN_EXPIRY = "15m";

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function isValidEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// POST: Send OTP to email (for enrollment verification)
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ success: false, error: "Valid email is required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const otp = generateOtp();
        await OTP.findOneAndUpdate(
            { email: normalizedEmail, purpose: "enrollment" },
            { otp: otp, attempts: 0, createdAt: new Date() },
            { upsert: true, new: true }
        );

        const result = await sendOtpEmail(normalizedEmail, otp);
        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error || "Failed to send OTP email"
            });
        }
        res.status(200).json({
            success: true,
            message: "OTP sent to your email. Valid for 10 minutes."
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, error: "Failed to send OTP" });
    }
};

// POST: Verify OTP and return short-lived verification token
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, error: "Email and OTP are required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const otpRecord = await OTP.findOne({ email: normalizedEmail, purpose: "enrollment" });
        if (!otpRecord) {
            return res.status(400).json({ success: false, error: "OTP expired or not found. Please request a new OTP." });
        }
        if (String(otp).trim() !== otpRecord.otp) {
            await OTP.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
            return res.status(400).json({ success: false, error: "Invalid OTP." });
        }
        await OTP.deleteOne({ _id: otpRecord._id });
        const verificationToken = jwt.sign(
            { type: "enrollment_verify", email: normalizedEmail },
            JWT_SECRET,
            { expiresIn: VERIFICATION_TOKEN_EXPIRY }
        );
        res.status(200).json({
            success: true,
            message: "Email verified. You can now complete enrollment.",
            verificationToken
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, error: "Failed to verify OTP" });
    }
};

function verifyEnrollmentToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded && decoded.type === "enrollment_verify" && decoded.email ? decoded.email : null;
    } catch (err) {
        return null;
    }
}

// Normalize participant to enrollmentData shape
function normalizeParticipant(p) {
    return {
        fullName: p.fullName || "",
        age: p.age || "",
        gender: p.gender || "",
        bloodGroup: p.bloodGroup || "",
        address: p.address || "",
        mobile: p.mobile || "",
        email: p.email || "",
        pickupPoint: p.pickupPoint || "",
        foodPreference: p.foodPreference || "Veg",
        medicalCondition: p.medicalCondition || "No",
        medicalConditionDetails: p.medicalConditionDetails || "",
        emergencyName: p.emergencyName || "",
        emerContactNumber: p.emerContactNumber || "",
        emergencyRelation: p.emergencyRelation || ""
    };
}

// POST: Enroll in a trek (single or multi-participant; auth optional)
// Body: { trekId, primaryContact: { fullName, email, mobile }, participants: [ { fullName, age, ... }, ... ] }
// Or legacy: { trekId, enrollmentData } → treated as one participant
const enrollInTrek = async (req, res) => {
    try {
        const { trekId, primaryContact, participants: rawParticipants, enrollmentData: legacyData, verificationToken } = req.body;
        const userId = req.user ? req.user.userId : null;

        // OTP verification — optional until SMS service is integrated
        const verifiedEmail = verificationToken ? verifyEnrollmentToken(verificationToken) : null;
        if (verificationToken && !verifiedEmail) {
            return res.status(400).json({
                success: false,
                error: "Verification expired or invalid. Please verify your email again."
            });
        }

        let participants = rawParticipants;
        let primary = primaryContact;

        if (participants && Array.isArray(participants) && participants.length > 0) {
            participants = participants.map(normalizeParticipant);
            primary = primary || (participants[0] && {
                fullName: participants[0].fullName,
                email: participants[0].email,
                mobile: participants[0].mobile
            });
        } else if (legacyData && typeof legacyData === "object") {
            participants = [normalizeParticipant(legacyData)];
            primary = primary || {
                fullName: legacyData.fullName,
                email: legacyData.email,
                mobile: legacyData.mobile
            };
        } else {
            return res.status(400).json({
                success: false,
                error: "Provide participants array or enrollmentData"
            });
        }

        if (!primary || !primary.email || !primary.mobile) {
            return res.status(400).json({
                success: false,
                error: "Primary contact (email and mobile) is required"
            });
        }

        // When OTP is active: primary contact email must match verified email
        if (verifiedEmail && primary.email.trim().toLowerCase() !== verifiedEmail) {
            return res.status(400).json({
                success: false,
                error: "Primary contact email must match the email you verified with OTP."
            });
        }

        const trek = await Trek.findById(trekId);
        if (!trek) {
            return res.status(404).json({ success: false, error: "Trek not found" });
        }

        const currentCount = await Enrollment.countDocuments({
            trek: trekId,
            enrollmentStatus: { $in: ["Confirmed", "Pending"] }
        });
        const maxParticipants = trek.maxParticipants || 0;
        if (currentCount + participants.length > maxParticipants) {
            return res.status(400).json({
                success: false,
                error: `Only ${maxParticipants - currentCount} spot(s) left. You requested ${participants.length}.`
            });
        }

        const now = new Date();
        if (trek.registrationDeadline && now > new Date(trek.registrationDeadline)) {
            return res.status(400).json({
                success: false,
                error: "Registration deadline has passed"
            });
        }
        if (trek.status !== "Upcoming" || !trek.isActive) {
            return res.status(400).json({
                success: false,
                error: "Trek is not available for enrollment"
            });
        }

        const bookingId = new mongoose.Types.ObjectId();
        const primaryContactDoc = {
            fullName: (primary && primary.fullName) || "",
            email: (primary && primary.email) || "",
            mobile: (primary && primary.mobile) || ""
        };

        const created = [];
        for (const p of participants) {
            const enrollment = new Enrollment({
                trek: trekId,
                user: userId,
                bookingId,
                primaryContact: primaryContactDoc,
                enrollmentData: p,
                paymentAmount: trek.price,
                enrollmentStatus: "Pending"
            });
            await enrollment.save();
            created.push(enrollment);
        }

        const populated = await Enrollment.find({ _id: { $in: created.map(e => e._id) } })
            .populate('trek', 'title startDate endDate location')
            .populate('user', 'fullName email')
            .lean();

        // Send confirmation emails (fire-and-forget — don't block response)
        const emailData = {
            primaryContact: primaryContactDoc,
            trek: { title: trek.title, startDate: trek.startDate, endDate: trek.endDate, location: trek.location, duration: trek.duration, difficulty: trek.difficulty },
            bookingId: bookingId.toString(),
            participants,
            paymentAmount: trek.price * participants.length,
        };
        if (primaryContactDoc.email) {
            sendEnrollmentConfirmation(emailData).catch(err => console.error("Enrollment confirmation email failed:", err));
        }

        res.status(201).json({
            success: true,
            message: participants.length === 1
                ? "Successfully enrolled in trek"
                : `Successfully enrolled ${participants.length} participants`,
            data: {
                bookingId,
                count: participants.length,
                enrollments: populated
            }
        });
    } catch (error) {
        console.error("Error enrolling in trek:", error);
        res.status(500).json({ success: false, error: "Failed to enroll in trek" });
    }
};

// GET: Get user's enrollments
const getUserEnrollments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { user: userId };
        if (status) filter.enrollmentStatus = status;

        const enrollments = await Enrollment.find(filter)
            .populate('trek', 'title startDate endDate location price images status')
            .populate('user', 'fullName email')
            .sort({ enrolledAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Enrollment.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: enrollments,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error("Error fetching user enrollments:", error);
        res.status(500).json({ success: false, error: "Failed to fetch enrollments" });
    }
};

// GET: Get single enrollment by ID
const getEnrollmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const enrollment = await Enrollment.findById(id)
            .populate('trek')
            .populate('user', 'fullName email');

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: "Enrollment not found"
            });
        }

        // Check if user owns this enrollment or is admin
        if (enrollment.user._id.toString() !== userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: "Access denied"
            });
        }

        res.status(200).json({
            success: true,
            data: enrollment
        });
    } catch (error) {
        console.error("Error fetching enrollment:", error);
        res.status(500).json({ success: false, error: "Failed to fetch enrollment" });
    }
};

// PUT: Update enrollment (Admin only)
const updateEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Capture previous payment status before update
        const before = await Enrollment.findById(id).select("paymentStatus primaryContact trek").lean();

        const enrollment = await Enrollment.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        )
        .populate('trek', 'title startDate endDate location duration difficulty price')
        .populate('user', 'fullName email');

        if (!enrollment) {
            return res.status(404).json({ success: false, error: "Enrollment not found" });
        }

        // Fire payment emails when status changes to Paid
        const newStatus = updateData.paymentStatus;
        if (newStatus === "Paid" && before?.paymentStatus !== "Paid") {
            const pc = enrollment.primaryContact;
            const trek = enrollment.trek;
            const emailData = {
                primaryContact: pc,
                trek,
                bookingId: enrollment.bookingId?.toString() || id,
                paymentAmount: updateData.paymentAmount || enrollment.paymentAmount,
                paymentMethod: updateData.paymentMethod,
                transactionId: updateData.transactionId,
                paymentDate: updateData.paymentDate || new Date(),
            };
            if (pc?.email) {
                sendPaymentConfirmation(emailData).catch(err => console.error("Payment confirmation email failed:", err));
            }
        }

        res.status(200).json({
            success: true,
            message: "Enrollment updated successfully",
            data: enrollment
        });
    } catch (error) {
        console.error("Error updating enrollment:", error);
        res.status(500).json({ success: false, error: "Failed to update enrollment" });
    }
};

// DELETE: Cancel enrollment
const cancelEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const enrollment = await Enrollment.findById(id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: "Enrollment not found"
            });
        }

        // Check if user owns this enrollment or is admin (enrollment.user can be null for guest enrollments)
        const enrollmentUserId = enrollment.user == null ? null : String(enrollment.user);
        const requestUserId = req.user && req.user.userId != null ? String(req.user.userId) : null;
        const isOwner = enrollmentUserId !== null && requestUserId !== null && enrollmentUserId === requestUserId;
        const isAdmin = req.user && req.user.role && String(req.user.role).toLowerCase() === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: "Access denied"
            });
        }

        // Check if cancellation is allowed (e.g., not too close to trek date)
        const trek = enrollment.trek ? await Trek.findById(enrollment.trek) : null;
        if (trek && trek.startDate) {
            const daysUntilTrek = Math.ceil((trek.startDate - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilTrek < 7) {
                return res.status(400).json({
                    success: false,
                    error: "Cannot cancel enrollment less than 7 days before trek"
                });
            }
        }

        const cancelledEnrollment = await Enrollment.findByIdAndUpdate(
            id,
            { enrollmentStatus: "Cancelled", updatedAt: new Date() },
            { new: true }
        ).populate('trek', 'title startDate endDate location duration difficulty').lean();

        // Send cancellation email (fire-and-forget)
        const pc = enrollment.primaryContact;
        if (pc?.email && cancelledEnrollment) {
            sendCancellationConfirmation({
                primaryContact: pc,
                trek: cancelledEnrollment.trek || {},
                bookingId: enrollment.bookingId?.toString() || id,
            }).catch(err => console.error("Cancellation email failed:", err));
        }

        res.status(200).json({
            success: true,
            message: "Enrollment cancelled successfully"
        });
    } catch (error) {
        console.error("Error cancelling enrollment:", error);
        res.status(500).json({ success: false, error: "Failed to cancel enrollment" });
    }
};

// GET: Get all enrollments for a trek (Admin only)
const getTrekEnrollments = async (req, res) => {
    try {
        const { trekId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const filter = { trek: trekId };
        if (status) filter.enrollmentStatus = status;

        const enrollments = await Enrollment.find(filter)
            .populate('user', 'fullName email')
            .sort({ enrolledAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Enrollment.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: enrollments,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error("Error fetching trek enrollments:", error);
        res.status(500).json({ success: false, error: "Failed to fetch trek enrollments" });
    }
};

// GET: Get enrollment statistics (Admin only)
const getEnrollmentStats = async (req, res) => {
    try {
        const stats = await Enrollment.aggregate([
            {
                $group: {
                    _id: "$enrollmentStatus",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$paymentAmount" }
                }
            }
        ]);

        const totalEnrollments = await Enrollment.countDocuments();
        const paidEnrollments = await Enrollment.countDocuments({ paymentStatus: "Paid" });
        const pendingEnrollments = await Enrollment.countDocuments({ enrollmentStatus: "Pending" });

        // Recent enrollments for dashboard
        const recentEnrollments = await Enrollment.find()
            .populate('trek', 'title')
            .sort({ enrolledAt: -1 })
            .limit(5)
            .lean()
            .then(docs => docs.map(d => ({
                _id: d._id,
                participantName: d.participantName || d.fullName,
                trekName: d.trek?.title || "Unknown Trek",
                paymentStatus: d.paymentStatus?.toLowerCase(),
                status: d.enrollmentStatus?.toLowerCase(),
                enrolledAt: d.enrolledAt
            })));

        // Enrollments grouped by trek for chart
        const byTrek = await Enrollment.aggregate([
            {
                $lookup: {
                    from: "treks",
                    localField: "trek",
                    foreignField: "_id",
                    as: "trekInfo"
                }
            },
            { $unwind: { path: "$trekInfo", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$trek",
                    name: { $first: "$trekInfo.title" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalEnrollments,
                paidEnrollments,
                pendingEnrollments,
                statusBreakdown: stats,
                recentEnrollments,
                byTrek
            }
        });
    } catch (error) {
        console.error("Error fetching enrollment stats:", error);
        res.status(500).json({ success: false, error: "Failed to fetch enrollment statistics" });
    }
};

// GET: Get all enrollments (Admin only)
const getAllEnrollments = async (req, res) => {
    try {
        const { status, paymentStatus, page = 1, limit = 50 } = req.query;

        const filter = {};
        if (status) filter.enrollmentStatus = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        const enrollments = await Enrollment.find(filter)
            .populate('trek', 'title startDate endDate location price images status')
            .populate('user', 'fullName email')
            .sort({ enrolledAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Enrollment.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: enrollments,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error("Error fetching all enrollments:", error);
        res.status(500).json({ success: false, error: "Failed to fetch enrollments" });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    enrollInTrek,
    getUserEnrollments,
    getEnrollmentById,
    updateEnrollment,
    cancelEnrollment,
    getTrekEnrollments,
    getEnrollmentStats,
    getAllEnrollments
};
