import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const createDemoAccount = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Demo account details
    const demoEmail = 'demo@gmail.com';
    const demoPhone = '9876543210';
    const demoName = 'Karan';
    const demoOTP = '1234';

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [{ email: demoEmail }, { phone: demoPhone }] 
    });

    if (user) {
      console.log('⚠️  Demo user already exists. Updating...');
      
      // Update existing user
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            email: demoEmail,
            phone: demoPhone,
            name: demoName,
            otp: demoOTP,
            otpExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            authProvider: 'email',
            role: process.env.DEMO_ACCOUNT_ROLE || 'user',
            status: 'active',
            lastLoginAt: new Date(),
            lastActiveAt: new Date(),
          }
        }
      );
      
      user = await User.findById(user._id);
      console.log('✅ Demo user updated successfully');
    } else {
      console.log('📝 Creating new demo user...');
      
      // Create new user
      user = await User.create({
        email: demoEmail,
        phone: demoPhone,
        name: demoName,
        otp: demoOTP,
        otpExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        emailVerified: true,
        phoneVerified: true,
        profileCompleted: true,
        authProvider: 'email',
        role: process.env.DEMO_ACCOUNT_ROLE || 'user',
        status: 'active',
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
        loginCount: 1,
      });
      
      // Verify the created user
      user = await User.findById(user._id);
      console.log('✅ Demo user created successfully');
    }

    console.log('\n📊 Demo Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`OTP: ${demoOTP}`);
    console.log(`Role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log(`User ID: ${user._id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createDemoAccount();
