import { createHmac } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless function to verify Razorpay payment
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Validate required fields
        if (!razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing required payment data'
            });
        }

        // Get secret key from environment (server-side only)
        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET not configured');
            return res.status(500).json({
                success: false,
                error: 'Payment verification not configured'
            });
        }

        // Create signature verification string
        // For direct payment (without order): just payment_id
        // For order-based payment: order_id|payment_id
        const signaturePayload = razorpay_order_id
            ? `${razorpay_order_id}|${razorpay_payment_id}`
            : razorpay_payment_id;

        // Generate expected signature using HMAC SHA256
        const expectedSignature = createHmac('sha256', secret)
            .update(signaturePayload)
            .digest('hex');

        // Compare signatures (constant-time comparison to prevent timing attacks)
        const isValid = timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(razorpay_signature, 'hex')
        );

        if (isValid) {
            console.log('Payment verified successfully:', razorpay_payment_id);
            return res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id
            });
        } else {
            console.warn('Invalid payment signature:', razorpay_payment_id);
            return res.status(400).json({
                success: false,
                error: 'Invalid payment signature'
            });
        }

    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during verification'
        });
    }
}

// Timing-safe comparison to prevent timing attacks
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }

    return result === 0;
}
