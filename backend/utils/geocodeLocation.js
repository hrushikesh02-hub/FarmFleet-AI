const axios = require("axios");

const geocodeLocation = async (
  location
) => {
  try {
    const response =
      await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: location,
            format: "json",
            limit: 1,
          },
          headers: {
            "User-Agent":
              "FarmFleet-App",
          },
        }
      );

    if (
      !response.data ||
      response.data.length === 0
    ) {
      return null;
    }

    return {
      lat: parseFloat(
        response.data[0].lat
      ),
      lng: parseFloat(
        response.data[0].lon
      ),
    };
  } catch (error) {
    console.error(
      "Geocode Error:",
      error.message
    );

    return null;
  }
};

module.exports = geocodeLocation;