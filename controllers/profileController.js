const Profile = require('../models/profile');
const Client = require('../models/client');
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

        // Loop through each key in profileData
        for (const [key, value] of Object.entries(profileData)) {
            if (value === '' || value === null || value === undefined) {
                // If the value is empty, prepare to unset the field
                if (!updateData.$unset) updateData.$unset = {};
                updateData.$unset[key] = "";
            } else {
                // If the value is non-empty, prepare to set the field
                if (!updateData.$set) updateData.$set = {};

                // Special handling for additionalDetails
                if (key === 'additionalDetails' && Array.isArray(value)) {
                    // Filter out empty additionalDetails
                    updateData.$set.additionalDetails = value.filter(
                        (detail) => detail.name && detail.value
                    );
                } else {
                    updateData.$set[key] = value;
                }
            }
        }

        // Upsert the profile data
        const profile = await Profile.findOneAndUpdate(
            { clientId },
            updateData,
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
