const { getAsyncTable } = require('../utiles/dbConnect');
const path = require('path');

// Upsert profile: Update or insert a new profile
exports.upsertProfile = async (req, res) => {
  const { clientId } = req.params;
  const profileData = req.body;
  console.log('Data coming profile', profileData, clientId);

  try {
    // Handle file upload
    if (req.file) {
      profileData.profileImage = req.file.filename;
    } else if (!profileData.profileImage) {
      profileData.profileImage = null;
    }

    // Clean up profileData by removing empty values
    for (const key in profileData) {
      if (!profileData[key]) {
        profileData[key] = null;
      }
    }

    const profilesTable = await getAsyncTable('profiles');

    // Convert profileData to HBase format
    const profileColumns = Object.entries(profileData).map(([key, value]) => ({
      column: `info:${key}`,
      $: value
    }));

    // Upsert profile
    await profilesTable.put(clientId, profileColumns);

    console.log('Successfully stored');
    res.status(200).json(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Get profile by client ID
exports.getProfile = async (req, res) => {
  const { clientId } = req.params;

  try {
    const profilesTable = await getAsyncTable('profiles');
    const profileRow = await profilesTable.get(clientId);
    
    if (!profileRow) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Transform HBase row back to JSON structure
    const profile = Object.fromEntries(
      profileRow.map(col => [col.column.split(':')[1], col.$])
    );

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error retrieving profile:', error);
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
};