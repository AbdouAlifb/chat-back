const Profile = require('../models/profile');
const Client = require('../models/client');
const ProfileModel = require('../models/profileModel');
const path = require('path');

exports.upsertProfile = async (req, res) => {
  const { clientId } = req.params;
  const profileData = req.body;
  console.log('data coming profile', profileData, clientId);

  try {
    // Handle file upload
    if (req.file) {
      profileData.profileImage = req.file.filename;
    } else if (!profileData.profileImage) {
      profileData.profileImage = null; // Set to null to remove the property
    }

    // Clean up profileData by removing empty values
    for (const key in profileData) {
      if (!profileData[key]) {
        profileData[key] = null;
      }
    }

    // Update or insert the profile
    const updatedProfile = await ProfileModel.upsertProfile(clientId, profileData);

    console.log('Successfully stored');
    return res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error); // Add this line
    return res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Get profile by client ID
exports.getProfile = async (req, res) => {
  const { clientId } = req.params;

  try {
    const profile = await ProfileModel.getProfile(clientId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
};


// Additional methods for deleting or modifying the profile could be added here as needed
