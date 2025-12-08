// User controller
import { db } from '../config/firebase.js';
import { User } from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('Getting profile for user:', userId);
    
    // Check if Firestore is available
    if (!db) {
      console.error('Firestore database not initialized');
      return res.status(500).json({ error: 'Database not initialized' });
    }
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    console.log('User document exists:', userDoc.exists);
    
    if (!userDoc.exists) {
      // If user doesn't exist in Firestore, create a basic profile
      const userData = {
        id: userId,
        email: req.user.email,
        firstName: '',
        lastName: '',
        farmAddress: '',
        acres: '',
        phone: '',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Creating new user profile for:', userId);
      await db.collection('users').doc(userId).set(userData);
      const user = new User(userData);
      return res.json({ user: user.toJSON() });
    }
    
    const userData = { id: userId, ...userDoc.data() };
    const user = new User(userData);
    console.log('Returning user profile:', user.toJSON());
    
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      hint: 'Please check if Firestore is enabled in Firebase Console'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { firstName, lastName, email, farmAddress, acres, phone } = req.body;
    
    console.log('Updating profile for user:', userId);
    console.log('Update data:', { firstName, lastName, email, farmAddress, acres, phone });
    
    // Check if Firestore is available
    if (!db) {
      console.error('Firestore database not initialized');
      return res.status(500).json({ error: 'Database not initialized' });
    }
    
    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (farmAddress !== undefined) updateData.farmAddress = farmAddress;
    if (acres !== undefined) updateData.acres = acres;
    if (phone !== undefined) updateData.phone = phone;
    
    // Update user in Firestore
    console.log('Saving to Firestore...');
    await db.collection('users').doc(userId).set(updateData, { merge: true });
    
    // Get updated user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = { id: userId, ...userDoc.data() };
    const user = new User(userData);
    
    console.log('Profile updated successfully');
    res.json({ 
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      hint: 'Please check if Firestore is enabled in Firebase Console'
    });
  }
};

