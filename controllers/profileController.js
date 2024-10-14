const Profile = require('../models/profile');
const Client = require('../models/client');

// Create or update profile
exports.upsertProfile = async (req, res) => {
    const { clientId } = req.params;
    const profileData = req.body;

    try {
        // Check if client exists
        const clientExists = await Client.findById(clientId);
        if (!clientExists) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Upsert the profile data
        const profile = await Profile.findOneAndUpdate(
            { clientId },
            { $set: profileData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json(profile);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating profile', error: error });
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
