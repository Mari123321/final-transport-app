import axios from 'axios';

export const getDistance = async (req, res) => {
  const { origin, destination } = req.query;

  try {
    const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins: origin,
          destinations: destination,
          key: apiKey
        }
      }
    );

    const distance = response.data.rows[0].elements[0].distance.text;
    const duration = response.data.rows[0].elements[0].duration.text;

    res.json({ distance, duration });
  } catch (err) {
    console.error('Error fetching distance:', err);
    res.status(500).json({ error: 'Failed to fetch distance' });
  }
};
