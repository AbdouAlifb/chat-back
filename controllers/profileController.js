const Profile = require('../models/profile');
const Client = require('../models/client');
const path = require('path');

exports.upsertProfile = async (req, res) => {
    const { clientId } = req.params;
    const profileData = req.body;
  
    try {
      // Check if client exists
      const clientExists = await Client.findById(clientId);
      if (!clientExists) {
        return res.status(404).json({ message: 'Client not found' });
      }
  
      // Prepare the update object
      const updateData = {};
  
      // Handle the uploaded file
      if (req.file) {
        if (!updateData.$set) updateData.$set = {};
        updateData.$set.profileImage = req.file.filename;
      } else if (!profileData.profileImage) {
        if (!updateData.$unset) updateData.$unset = {};
        updateData.$unset.profileImage = '';
      }
  
      // Loop through each key in profileData
      for (const [key, value] of Object.entries(profileData)) {
        if (key === 'profileImage') continue;
  
        if (!value) {
          if (!updateData.$unset) updateData.$unset = {};
          updateData.$unset[key] = '';
        } else {
          if (!updateData.$set) updateData.$set = {};
          updateData.$set[key] = value;
        }
      }
  
      // Upsert the profile data
      const profile = await Profile.findOneAndUpdate(
        { clientId },
        updateData,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
  
      // Exclude unwanted fields from the response
      const profileObject = profile.toObject();
      delete profileObject.__v;
      delete profileObject.createdAt;
      delete profileObject.updatedAt;
  
      return res.status(200).json(profileObject);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
  };
  

// Get profile by client ID
exports.getProfile = async (req, res) => {
    const { clientId } = req.params;

    try {
        const profile = await Profile.findOne({ clientId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        return res.status(200).json(profile);
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving profile', error: error });
    }
};

// Additional methods for deleting or modifying the profile could be added here as needed
