import { User } from "../model/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyMail } from "../emailVerify/verifyMail.js";
import { Session } from "../model/sessionModel.js";
import { sendOtpMail } from "../emailVerify/sendOtpMail.js";
import crypto from "crypto";
import { Contact } from "../model/contactModel.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";



export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, address, mantras } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, Email & Password are required."
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            mantras,
            isVerified: false
        });

        const token = jwt.sign(
            { id: newUser._id },
            process.env.SECRET_KEY,
            { expiresIn: "10m" }
        );

        try {
            await verifyMail(token, email);
        } catch (emailError) {
            console.error("Email failed:", emailError.message);
            await User.findByIdAndDelete(newUser._id);
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email",
            });
        }


        newUser.token = token;
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your email.",
            data: newUser
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



export const verification = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing or invalid"
            })
        }
        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(400).json({
                    success: false,
                    message: "The registration token has expired"
                })
            }
            return res.status(400).json({
                success: false,
                message: "Token verification failed"
            })
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        user.token = null
        user.isVerified = true
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

export const loginUser = async (req, res) => {
    try {
        // to getting email and password for login
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // check user exist or not
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            })
        }

        // user present but  check correct password or not
        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) {
            return res.status(401).json({
                success: false,
                message: "Incorrect Password"
            })
        }

        // check user is verified or not 
        if (user.isVerified !== true) {
            return res.status(403).json({
                success: false,
                message: "Verify your account than login"
            })
        }

        //check for existing session and delete it

        const existingSession = await Session.findOne({ userId: user._id });
        if (existingSession) {
            await Session.deleteOne({ userId: user._id });
        }

        // create new session
        await Session.create({ userId: user._id });

        //generate token
        // loginUser
        const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '10d' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '30d' });

        // Send refresh token in secure cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // only HTTPS
            sameSite: 'none',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });


        user.isLoggedIn = true;
        await user.save();


        const { password: pass, otp, otpExpiry, token, __v, ...publicUser } = user.toObject();

        return res.status(200).json({
            success: true,
            message: `Welcome back ${user.name}`,
            accessToken,
            refreshToken,
            user: publicUser
        });


        // return res.status(200).json({
        //     success: true,
        //     message: `Welcome back ${user.name}`,
        //     accessToken,
        //     refreshToken,
        //     user
        // })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

export const logoutUser = async (req, res) => {
    try {
        const userId = req.userId;
        await Session.deleteMany({ userId });
        await User.findByIdAndUpdate(userId, { isLoggedIn: false });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        // generate 6 digit otp
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
        user.otp = hashedOtp;

        user.otpExpiry = expiry;
        await user.save();

        try {
            await sendOtpMail(email, otp);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP email",
            });
        }


        return res.status(200).json({
            success: true,
            message: "Otp sent successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



export const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    const { email } = req.params;

    if (!otp) {
        return res.status(400).json({
            success: false,
            message: "OTP is required"
        });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP not generated or already verified"
            });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one"
            });
        }

        // 🔑 HASH incoming OTP
        const hashedOtp = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        if (hashedOtp !== user.otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // ✅ OTP verified
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const changePassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const email = req.params.email;

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Password do not match"
        })
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const hashedpassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedpassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successsfully"
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}


export const sendContactMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        await Contact.create({ name, email, message });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully"
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId; // set by auth middleware

        const { name, phone, address, mantras, } = req.body;

        const file = req.file;

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        /* ---------------- Profile Image Upload ---------------- */
        if (file) {
            const fileUri = getDataUri(file);
            const uploadRes = await cloudinary.uploader.upload(fileUri, {
                folder: "profiles",
            });
            user.profilePic = uploadRes.secure_url;
        }

        /* ---------------- Allowed Updates ONLY ---------------- */
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (mantras) user.mantras = mantras;

        // ❌ email & password are intentionally ignored

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });

    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
        });
    }
};

